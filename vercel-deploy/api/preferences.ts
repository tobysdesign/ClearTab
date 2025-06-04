import { VercelRequest, VercelResponse } from '@vercel/node';

const mockPreferences = {
  id: 1,
  userId: 1,
  agentName: "Aria",
  userName: "Demo User",
  theme: "dark" as const,
  language: "en",
  timezone: "America/New_York",
  notifications: true,
  paydayDate: new Date('2025-01-31'),
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15')
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(mockPreferences);
  }

  if (req.method === 'PUT') {
    Object.assign(mockPreferences, req.body, { updatedAt: new Date() });
    return res.status(200).json(mockPreferences);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}