import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data for demo
const mockNotes = [
  {
    id: 1,
    userId: 1,
    title: "Project Planning Meeting",
    content: "Discuss Q1 roadmap and resource allocation",
    tags: ["work", "planning"],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    id: 2,
    userId: 1,
    title: "Personal Goals",
    content: "Focus on health, learning, and work-life balance",
    tags: ["personal", "goals"],
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14')
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(mockNotes);
  }

  if (req.method === 'POST') {
    const newNote = {
      id: Date.now(),
      userId: 1,
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockNotes.push(newNote);
    return res.status(201).json(newNote);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const noteIndex = mockNotes.findIndex(note => note.id === parseInt(id as string));
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    mockNotes[noteIndex] = { ...mockNotes[noteIndex], ...req.body, updatedAt: new Date() };
    return res.status(200).json(mockNotes[noteIndex]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    const noteIndex = mockNotes.findIndex(note => note.id === parseInt(id as string));
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    mockNotes.splice(noteIndex, 1);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}