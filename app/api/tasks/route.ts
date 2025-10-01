import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks } from "@/shared/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, user.id))
      .orderBy(desc(tasks.createdAt));

    return NextResponse.json({ data: allTasks });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
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
    const { title, description, dueDate, priority, isCompleted } = body;

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.id,
        title: title || "Untitled Task",
        content: description
          ? [
              {
                type: "paragraph",
                content: [{ type: "text", text: description }],
              },
            ]
          : [],
        dueDate: dueDate ? new Date(dueDate) : null,
        isHighPriority: priority === "high",
        isCompleted: isCompleted || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: newTask });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
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
    const { id, title, description, dueDate, priority, isCompleted } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) {
      updateData.content = description
        ? [
            {
              type: "paragraph",
              content: [{ type: "text", text: description }],
            },
          ]
        : [];
    }
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.isHighPriority = priority === "high";
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedTask });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
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
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
