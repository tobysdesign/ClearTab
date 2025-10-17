import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks } from "@/shared/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    let allTasks;

    if (devBypass) {
      // Return mock tasks for development
      console.log('🔧 Development mode: Bypassing auth for tasks API');
      allTasks = [
        {
          id: '1',
          title: 'Review dashboard functionality',
          completed: false,
          isCompleted: false,
          priority: 'high',
          dueDate: new Date(Date.now() + 24*60*60*1000).toISOString(),
          userId: '00000000-0000-4000-8000-000000000000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Test extension build',
          completed: true,
          isCompleted: true,
          priority: 'medium',
          dueDate: null,
          userId: '00000000-0000-4000-8000-000000000000',
          createdAt: new Date(Date.now() - 24*60*60*1000).toISOString(),
          updatedAt: new Date(Date.now() - 24*60*60*1000).toISOString()
        }
      ];
    } else {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      allTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, user.id))
        .orderBy(desc(tasks.createdAt));
    }

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
