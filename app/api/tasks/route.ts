import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tasks } from "@/shared/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';
    const defaultUserId = '00000000-0000-4000-8000-000000000000';

    let userId = defaultUserId;

    if (!devBypass) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
    }

    // Check if fetching a single task by ID
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    if (taskId) {
      // Fetch single task
      const [task] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      return NextResponse.json({ data: task });
    }

    // Fetch all tasks
    const allTasks = await db
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
    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';
    const defaultUserId = '00000000-0000-4000-8000-000000000000';

    let userId = defaultUserId;

    if (!devBypass) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
    }

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

    const [newTask] = await db
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
    console.log('PUT /api/tasks - Starting request processing');

    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';

    const body = await request.json();
    console.log('PUT /api/tasks - Request body:', body);

    const { id, title, content, dueDate, isHighPriority, isCompleted, description, priority } = body;

    if (!id) {
      console.log('PUT /api/tasks - No ID provided');
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    console.log('PUT /api/tasks - Task ID:', id);


    // Regular database operation
    let userId = '00000000-0000-4000-8000-000000000000';

    if (!devBypass) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('PUT /api/tasks - No user found, unauthorized');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
      console.log('PUT /api/tasks - User found:', user.id);
    } else {
      console.log('PUT /api/tasks - Using dev bypass with default user');
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

    console.log('PUT /api/tasks - Update data:', updateData);

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    console.log('PUT /api/tasks - Database result:', updatedTask);

    if (!updatedTask) {
      console.log('PUT /api/tasks - Task not found');
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    console.log('PUT /api/tasks - Success, returning task');
    return NextResponse.json({ data: updatedTask });
  } catch (error) {
    console.error("PUT /api/tasks - Error:", error);
    console.error("PUT /api/tasks - Error stack:", error.stack);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Development bypass for testing
    const devBypass = process.env.DEV_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development';
    const defaultUserId = '00000000-0000-4000-8000-000000000000';

    let userId = defaultUserId;

    if (!devBypass) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;
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
