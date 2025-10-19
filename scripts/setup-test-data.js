// Direct SQL approach to clear and populate test data
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = envContent.split('\n').filter(line => line.includes('='));
  for (const line of envVars) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // Remove surrounding quotes if they exist
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key.trim()] = value;
    }
  }
}

const DEFAULT_USER_ID = '00000000-0000-4000-8000-000000000000';

const testTasks = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: DEFAULT_USER_ID,
    title: 'Review dashboard functionality',
    content: JSON.stringify({
      ops: [
        { insert: 'Implement the main dashboard with widgets and proper layout. Make sure all the widgets are responsive and work well together.' },
        { insert: '\n' }
      ]
    }),
    is_completed: false,
    is_high_priority: true,
    due_date: new Date(Date.now() + 24*60*60*1000), // Tomorrow
    order_num: 1,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    user_id: DEFAULT_USER_ID,
    title: 'Fix mobile responsiveness',
    content: JSON.stringify({
      ops: [
        { insert: 'Ensure all components work properly on mobile devices, especially the task editor and form layouts.' },
        { insert: '\n' }
      ]
    }),
    is_completed: false,
    is_high_priority: false,
    due_date: new Date(Date.now() + 3*24*60*60*1000), // 3 days
    order_num: 2,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    user_id: DEFAULT_USER_ID,
    title: 'Update documentation',
    content: JSON.stringify({
      ops: [
        { insert: 'Write comprehensive docs for the widget system and API endpoints.' },
        { insert: '\n' }
      ]
    }),
    is_completed: true,
    is_high_priority: false,
    due_date: new Date(Date.now() - 2*24*60*60*1000), // 2 days ago (past due)
    order_num: 3,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    user_id: DEFAULT_USER_ID,
    title: 'Optimize performance',
    content: JSON.stringify({
      ops: [
        { insert: 'Profile the application and identify bottlenecks. Focus on reducing bundle size and improving load times.' },
        { insert: '\n' }
      ]
    }),
    is_completed: false,
    is_high_priority: true,
    due_date: new Date(Date.now() + 7*24*60*60*1000), // 1 week
    order_num: 4,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    user_id: DEFAULT_USER_ID,
    title: 'Setup CI/CD pipeline',
    content: JSON.stringify({
      ops: [
        { insert: 'Configure automated testing and deployment workflows for both web and extension builds.' },
        { insert: '\n' }
      ]
    }),
    is_completed: false,
    is_high_priority: false,
    due_date: null, // No due date
    order_num: 5,
    created_at: new Date(),
    updated_at: new Date(),
  }
];

async function setupTestData() {
  try {
    console.log('Connecting to database...');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const client = postgres(connectionString);

    console.log('Setting up development user...');
    // Insert or update the development user
    await client`
      INSERT INTO "user" (
        id, email, name, google_calendar_connected, created_at, updated_at
      ) VALUES (
        ${DEFAULT_USER_ID}, 'dev@example.com', 'Development User', false, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW()
    `;

    console.log('Clearing existing tasks...');
    await client`DELETE FROM tasks WHERE user_id = ${DEFAULT_USER_ID}`;

    console.log('Inserting test tasks...');

    for (const task of testTasks) {
      await client`
        INSERT INTO tasks (
          id, user_id, title, content, is_completed, is_high_priority,
          due_date, "order", created_at, updated_at
        ) VALUES (
          ${task.id}, ${task.user_id}, ${task.title}, ${task.content},
          ${task.is_completed}, ${task.is_high_priority}, ${task.due_date},
          ${task.order_num}, ${task.created_at}, ${task.updated_at}
        )
      `;
    }

    console.log(`✅ Successfully added ${testTasks.length} test tasks`);
    console.log('Test data includes:');
    testTasks.forEach(task => {
      const status = task.is_completed ? '✓' : '○';
      const priority = task.is_high_priority ? ' (!HIGH!)' : '';
      const dueInfo = task.due_date ? ` (due: ${task.due_date.toDateString()})` : ' (no due date)';
      console.log(`  ${status} ${task.title}${priority}${dueInfo}`);
    });

    await client.end();
  } catch (error) {
    console.error('Failed to setup test data:', error);
    process.exit(1);
  }
}

setupTestData();