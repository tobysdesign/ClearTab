import { VercelRequest, VercelResponse } from '@vercel/node';

const mockCalendarEvents = [
  {
    id: 1,
    title: "Team Standup",
    date: "2025-06-04",
    time: "09:00",
    type: "meeting" as const
  },
  {
    id: 2,
    title: "Project Review",
    date: "2025-06-04",
    time: "14:00",
    type: "meeting" as const
  },
  {
    id: 3,
    title: "Client Call",
    date: "2025-06-05",
    time: "11:00",
    type: "call" as const
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(mockCalendarEvents);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}