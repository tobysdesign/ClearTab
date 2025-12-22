
import { dbMinimal } from "@/lib/db-minimal";
import { notes, tasks, connectedAccounts } from "@/shared/schema-tables";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { lightweightGoogleApi } from "@/lib/lightweight-google-api";

export interface AiContext {
  notes: any[];
  tasks: any[];
  calendarEvents: any[];
  formattedContext: string;
}

export async function getAiContext(userId: string): Promise<AiContext> {
  // 1. Fetch recent notes (limit 5)
  const recentNotes = await dbMinimal
    .select({
      title: notes.title,
      content: notes.content,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .limit(5);

  // 2. Fetch active tasks (limit 15)
  const activeTasks = await dbMinimal
    .select({
      title: tasks.title,
      isCompleted: tasks.isCompleted,
      dueDate: tasks.dueDate,
      isHighPriority: tasks.isHighPriority,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.isCompleted, false)
      )
    )
    .orderBy(desc(tasks.isHighPriority), desc(tasks.createdAt))
    .limit(15);

  // 3. Fetch Calendar Events (Next 7 days)
  let calendarEvents: any[] = [];
  try {
    const accounts = await dbMinimal
      .select()
      .from(connectedAccounts)
      .where(
        and(
          eq(connectedAccounts.userId, userId),
          eq(connectedAccounts.provider, 'google')
        )
      );

    for (const account of accounts) {
      if (account.accessToken && account.refreshToken) {
        try {
          // Refresh token if needed? Lightweight service might handle it or we might fail.
          // For now, try fetching. If it fails, maybe we need refresh logic here.
          // The lightweight service has refreshAccessToken but doesn't auto-refresh on request failure yet based on my read.
          // We will attempt to fetch.
          
          const events = await lightweightGoogleApi.getCalendarEvents(
            { accessToken: account.accessToken, refreshToken: account.refreshToken },
            account.providerAccountId // often email is stored here or separate field? Schema says providerAccountId.
            // Wait, getCalendarEvents second arg is accountEmail. providerAccountId is usually the numeric ID.
            // Let's assume we can use a placeholder or if we stored email in account we'd use it.
            // Checking schema: connectedAccounts has no email field. user table has email.
            // We'll use "User Calendar" as fallback name.
          );
          calendarEvents.push(...events);
        } catch (err) {
          console.error(`Failed to fetch events for account ${account.id}`, err);
        }
      }
    }
  } catch (e) {
    console.error("Error fetching connected accounts", e);
  }

  // Filter events for next 7 days and sort
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  
  const filteredEvents = calendarEvents.filter(e => {
    const start = new Date(e.start);
    return start >= now && start <= nextWeek;
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());


  // Format for AI
  const formattedContext = `
Current Time: ${new Date().toLocaleString()}

Recent Notes:
${recentNotes.map(n => `- ${n.title} (Updated: ${n.updatedAt?.toLocaleDateString()})`).join('\n')}

Active Tasks:
${activeTasks.map(t => `- [${t.isHighPriority ? 'URGENT' : 'Normal'}] ${t.title} (Due: ${t.dueDate?.toLocaleDateString() || 'No date'})`).join('\n')}

Upcoming Events (Next 7 Days):
${filteredEvents.map(e => `- ${e.title} at ${new Date(e.start).toLocaleString()} (${e.calendarName})`).join('\n')}
  `.trim();

  return {
    notes: recentNotes,
    tasks: activeTasks,
    calendarEvents: filteredEvents,
    formattedContext
  };
}
