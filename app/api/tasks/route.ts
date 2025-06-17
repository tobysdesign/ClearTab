import { NextResponse } from 'next/server';
import { MemStorage } from '../../../server/mem-storage';

export const runtime = 'nodejs'; // Use Node.js runtime

const storage = new MemStorage();
const DEFAULT_USER_ID = 1; // Demo user

export async function GET() {
  try {
    const tasks = await storage.getTasksByUserId(DEFAULT_USER_ID);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
} 