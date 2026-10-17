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

    // Bring-your-own-key only: the server carries no Gemini key.
    const headerKey = request.headers.get("x-user-gemini-key")?.trim();
    if (!headerKey) {
      return NextResponse.json(
        { success: false, error: "A Gemini API key is required. Add yours in Settings → Transcription." },
        { status: 400 }
      );
    }
    if (!/^[A-Za-z0-9_-]{20,}$/.test(headerKey)) {
      return NextResponse.json(
        { success: false, error: "Invalid API key format." },
        { status: 400 }
      );
    }
    const apiKey = headerKey;

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
      // Every request is BYOK now, so a 400/403 from Google means the user's key was rejected.
      const keyRejected = response.status === 400 || response.status === 403;
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
