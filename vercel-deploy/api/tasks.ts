import { VercelRequest, VercelResponse } from '@vercel/node';

// Using actual data structure from your current implementation
const mockTasks = [
  {
    id: 1,
    userId: 1,
    title: "Review design mockups",
    description: "Review the new dashboard designs from the team",
    status: "in-progress" as const,
    priority: "high" as const,
    dueDate: new Date('2025-01-20'),
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    id: 2,
    userId: 1,
    title: "Update project documentation",
    description: "Update README and API documentation",
    status: "todo" as const,
    priority: "medium" as const,
    dueDate: new Date('2025-01-25'),
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14')
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
    return res.status(200).json(mockTasks);
  }

  if (req.method === 'POST') {
    const newTask = {
      id: Date.now(),
      userId: 1,
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockTasks.push(newTask);
    return res.status(201).json(newTask);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const taskIndex = mockTasks.findIndex(task => task.id === parseInt(id as string));
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...req.body, updatedAt: new Date() };
    return res.status(200).json(mockTasks[taskIndex]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    const taskIndex = mockTasks.findIndex(task => task.id === parseInt(id as string));
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    mockTasks.splice(taskIndex, 1);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}