import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth/api-session";
import { dbMinimal } from "@/lib/db-minimal";
import { tasks } from "@/shared/schema-tables";
import { eq, desc, and } from "drizzle-orm";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No User ID" }, { status: 401 });
    }
    const userId = session.user.id;

    // Check if fetching a single task by ID
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    if (taskId) {
      // Fetch single task
      const [task] = await dbMinimal
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      return NextResponse.json({ data: task });
    }

    // Fetch all tasks
    const allTasks = await dbMinimal
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
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
    const session = await getApiSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No User ID" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { title, content, dueDate, isHighPriority, isCompleted, description, priority } = body;

    const insertValues = {
      userId: userId,
      title: title || "Untitled Task",
      content: content || (description
        ? {
            ops: [
              { insert: description },
              { insert: "\n" }
            ]
          }
        : { ops: [{ insert: "\n" }] }),
      dueDate: dueDate ? new Date(dueDate) : null,
      isHighPriority: isHighPriority !== undefined ? isHighPriority : (priority === "high"),
      isCompleted: isCompleted || false,
    } as const;

    const [newTask] = await dbMinimal
      .insert(tasks)
      .values(insertValues)
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
    const session = await getApiSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No User ID" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { id, title, content, dueDate, isHighPriority, isCompleted, description, priority } = body;

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
    if (content !== undefined) {
      updateData.content = content;
    } else if (description !== undefined) {
      updateData.content = description
        ? {
            ops: [
              { insert: description },
              { insert: "\n" }
            ]
          }
        : { ops: [{ insert: "\n" }] };
    }
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (isHighPriority !== undefined) {
      updateData.isHighPriority = isHighPriority;
    } else if (priority !== undefined) {
      updateData.isHighPriority = priority === "high";
    }
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const [updatedTask] = await dbMinimal
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedTask });
  } catch (error) {
    console.error("PUT /api/tasks - Error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getApiSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No User ID" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    await dbMinimal
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
