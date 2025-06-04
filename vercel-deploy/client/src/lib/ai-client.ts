import { apiRequest } from "./queryClient";

export interface ChatResponse {
  message: string;
  action?: string;
  note?: any;
  task?: any;
}

export async function sendChatMessage(message: string, useMemory: boolean = true): Promise<ChatResponse> {
  const response = await apiRequest("POST", "/api/chat", { message, useMemory });
  return response.json();
}

export async function createNoteFromAI(title: string, content: string, tags: string[] = []) {
  const response = await apiRequest("POST", "/api/notes", {
    title,
    content,
    tags,
  });
  return response.json();
}

export async function createTaskFromAI(title: string, description: string = "", priority: string = "medium") {
  const response = await apiRequest("POST", "/api/tasks", {
    title,
    description,
    priority,
  });
  return response.json();
}

export async function updateUserPreferences(preferences: Partial<{
  agentName: string;
  userName: string;
  paydayDate: Date;
  paydayFrequency: string;
  location: string;
}>) {
  const response = await apiRequest("PUT", "/api/preferences", preferences);
  return response.json();
}
