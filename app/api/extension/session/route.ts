import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/api-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Who the extension's token belongs to. A 401 here means the token is gone or expired.
export async function GET() {
  const session = await getApiSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { id, email, name, image } = session.user;
  return NextResponse.json(
    { user: { id, email, name, image }, expires: session.expires },
    { headers: { "Cache-Control": "no-store" } },
  );
}
