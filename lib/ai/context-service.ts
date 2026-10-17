
import { dbMinimal } from "@/lib/db-minimal";
import { notes, tasks, connectedAccounts, user as userTable } from "@/shared/schema-tables";
import { eq, desc, and } from "drizzle-orm";
import { googleApiService, type CalendarEvent } from "@/lib/google-api-service";

export interface AiContext {
  notes: any[];
  tasks: any[];
  calendarEvents: any[];
  formattedContext: string;
}

// A calendar we can fetch for this user: their primary calendar (tokens on the user row) or one
// of the extra Google accounts connected in Settings (tokens on the connectedAccounts row).
type CalendarSource = {
  kind: "primary" | "connected";
  id: string;
  email: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
};

async function persistRefreshedToken(source: CalendarSource, accessToken: string, expiresIn: number) {
  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
  if (source.kind === "primary") {
    await dbMinimal.update(userTable).set({ accessToken, tokenExpiry } as any).where(eq(userTable.id, source.id));
  } else {
    await dbMinimal.update(connectedAccounts).set({ accessToken, tokenExpiry } as any).where(eq(connectedAccounts.id, source.id));
  }
}

// Fetch one source's events, refreshing the access token when it's expired or rejected. Mirrors
// /api/calendar's recovery logic so the AI sees the same events as the Schedule widget. A broken
// source is skipped (returns []) rather than failing the whole context.
async function fetchSourceEvents(source: CalendarSource): Promise<CalendarEvent[]> {
  if (!source.accessToken && !source.refreshToken) return [];

  const refresh = async () => {
    const refreshed = await googleApiService.refreshAccessToken(source.refreshToken!);
    await persistRefreshedToken(source, refreshed.access_token, refreshed.expires_in);
    return refreshed.access_token;
  };

  try {
    const expired =
      !source.accessToken || (source.tokenExpiry !== null && source.tokenExpiry.getTime() < Date.now() + 60_000);
    const accessToken = expired && source.refreshToken ? await refresh() : source.accessToken!;
    try {
      return await googleApiService.getCalendarEvents(
        { accessToken, refreshToken: source.refreshToken || undefined },
        source.email,
      );
    } catch (error) {
      if (!source.refreshToken || expired) throw error;
      return await googleApiService.getCalendarEvents(
        { accessToken: await refresh(), refreshToken: source.refreshToken || undefined },
        source.email,
      );
    }
  } catch (error) {
    console.error(
      `AI context: calendar fetch failed for ${source.kind} source ${source.id}:`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

// Upcoming events across the user's primary calendar and every connected account, deduped and
// limited to the next 7 days.
async function getUpcomingEvents(userId: string): Promise<CalendarEvent[]> {
  const [primary] = await dbMinimal.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
  const accounts = await dbMinimal.select().from(connectedAccounts).where(eq(connectedAccounts.userId, userId));

  const sources: CalendarSource[] = [];
  if (primary && (primary.accessToken || primary.refreshToken)) {
    sources.push({
      kind: "primary",
      id: primary.id,
      email: primary.email,
      accessToken: primary.accessToken,
      refreshToken: primary.refreshToken,
      tokenExpiry: primary.tokenExpiry,
    });
  }
  for (const account of accounts) {
    sources.push({
      kind: "connected",
      id: account.id,
      // providerAccountId is the account's Google email, saved when it was connected
      email: account.providerAccountId,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      tokenExpiry: account.tokenExpiry,
    });
  }

  if (sources.length === 0) return [];

  const all = (await Promise.all(sources.map(fetchSourceEvents))).flat();

  // The same meeting can appear on more than one calendar: show it once
  const seen = new Set<string>();
  const deduped = all.filter((event) => {
    if (!event.id) return true;
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  return deduped
    .filter((event) => {
      const start = new Date(event.start);
      return start >= now && start <= nextWeek;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
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
    .where(and(eq(tasks.userId, userId), eq(tasks.isCompleted, false)))
    .orderBy(desc(tasks.isHighPriority), desc(tasks.createdAt))
    .limit(15);

  // 3. Fetch upcoming calendar events (primary + connected accounts, next 7 days)
  const upcomingEvents = await getUpcomingEvents(userId);

  const formatEventWhen = (event: CalendarEvent) => {
    const start = new Date(event.start);
    return event.allDay
      ? start.toLocaleDateString()
      : start.toLocaleString();
  };

  // Format for AI
  const formattedContext = `
Current Time: ${new Date().toLocaleString()}

Recent Notes:
${recentNotes.map(n => `- ${n.title} (Updated: ${n.updatedAt?.toLocaleDateString()})`).join('\n') || '- None'}

Active Tasks:
${activeTasks.map(t => `- [${t.isHighPriority ? 'URGENT' : 'Normal'}] ${t.title} (Due: ${t.dueDate?.toLocaleDateString() || 'No date'})`).join('\n') || '- None'}

Upcoming Events (Next 7 Days):
${upcomingEvents.map(e => `- ${e.title} at ${formatEventWhen(e)} (${e.calendarName})`).join('\n') || '- None'}
  `.trim();

  return {
    notes: recentNotes,
    tasks: activeTasks,
    calendarEvents: upcomingEvents,
    formattedContext,
  };
}
