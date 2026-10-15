import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/api-session";

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Bring-your-own-key: if the client sent its own key, use it instead of the server key.
    const headerKey = request.headers.get("x-user-gemini-key")?.trim();
    if (headerKey && !/^[A-Za-z0-9_-]{20,}$/.test(headerKey)) {
      return NextResponse.json(
        { success: false, error: "Invalid API key format." },
        { status: 400 }
      );
    }

    let apiKey =
      headerKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_AI_KEY;

    // Fallback in case dev server was started before .env.local was saved
    if (!apiKey) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const envPath = path.resolve(process.cwd(), ".env.local");
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, "utf-8");
          const match = content.match(/^(?:GEMINI_API_KEY|GOOGLE_API_KEY|GOOGLE_AI_KEY)=["']?([^"'\r\n]+)["']?/m);
          if (match?.[1]) {
            apiKey = match[1].trim();
          }
        }
      } catch (err) {
        console.warn("Could not read fallback .env.local:", err);
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Google Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file and restart your dev server.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "No audio file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = audioFile.type || "audio/webm";

    // Use Google Gemini Flash for speech transcription.
    // Key goes in a header, not the URL, so it never lands in access/proxy logs.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Transcribe the following audio accurately and verbatim.\n\n- If there are multiple distinct voices or speakers, identify each speaker by voice characteristics and label their dialogue turns as \"Voice 1:\", \"Voice 2:\", etc. on separate lines.\n- If there is only a single speaker throughout the recording, transcribe the text directly without adding voice or speaker labels.\n- Return ONLY the transcribed text. Do not include introductory remarks, timestamps, markdown blocks, or conversational commentary.",
              },
              {
                inlineData: {
                  mimeType,
                  data: base64Audio,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Gemini transcription error:", response.status, errorText);
      // A user-supplied key that Google rejects (400/403) is a settings problem, not a 500.
      const keyRejected = Boolean(headerKey) && (response.status === 400 || response.status === 403);
      return NextResponse.json(
        {
          success: false,
          error: keyRejected
            ? "Your Gemini API key was rejected. Check it in Settings → Transcription."
            : `Google transcription failed: ${response.statusText}`,
        },
        { status: keyRejected ? 401 : response.status }
      );
    }

    const result = await response.json();
    const transcribedText =
      result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    return NextResponse.json({
      success: true,
      data: {
        text: transcribedText,
      },
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to transcribe audio",
      },
      { status: 500 }
    );
  }
}
