import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { notes } from "@/shared/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(desc(notes.updatedAt));

    return NextResponse.json({ success: true, data: allNotes });
  } catch (error) {
    console.error("Notes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content } = body;

    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title: title || "Untitled Note",
        content: content || [],
      })
      .returning();

    return NextResponse.json({ success: true, data: newNote });
  } catch (error) {
    console.error("Notes API error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, noteId, title, content } = body;
    const finalId = id || noteId;

    if (!finalId) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 },
      );
    }

    const [updatedNote] = await db
      .update(notes)
      .set({
        title,
        content,
      })
      .where(eq(notes.id, finalId))
      .returning();

    if (!updatedNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedNote });
  } catch (error) {
    console.error("Notes API error:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 },
      );
    }

    await db.delete(notes).where(eq(notes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notes API error:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
