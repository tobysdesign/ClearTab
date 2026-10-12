import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/api-session";
import { getWeather, type WeatherUnits } from "@/lib/weather-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/weather?location=Sydney%2C%20NSW&units=METRIC
// Signed-in users only, so the Maps API key's quota isn't open to anyone.
export async function GET(request: NextRequest) {
  const session = await getApiSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const location = params.get("location")?.trim().slice(0, 200) || "Sydney, NSW";
  const units: WeatherUnits = params.get("units") === "IMPERIAL" ? "IMPERIAL" : "METRIC";

  try {
    const data = await getWeather(location, units);
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, max-age=600" } });
  } catch (error) {
    console.error("❌ Error in /api/weather:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch weather data.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
