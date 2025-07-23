import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/shared/schema';

// Use connection string from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a postgres connection with very strict timeouts
const client = postgres(connectionString, {
  max: 3,                    // Limit connection pool size
  idle_timeout: 5,           // Close idle connections after 5 seconds
  connect_timeout: 5,        // 5 second connection timeout
  prepare: false,            // Disable prepared statements
  ssl: false,                // Disable SSL for local development
  statement_timeout: 5000,   // 5 second statement timeout
  debug: console.log,        // Log all queries
  types: {
    date: {
      to: 1184,
      from: [1082, 1083, 1114, 1184],
      serialize: (date: Date) => date.toISOString(),
      parse: (str: string) => new Date(str),
    },
  },
  onnotice: () => {},        // Ignore notice messages
  onparameter: () => {},     // Ignore parameter messages
});

// Create drizzle database instance with schema
export const db = drizzle(client, { schema });

// Testing function to verify connectivity
export async function testConnection() {
  try {
    const result = await client`SELECT 1 as test`;
    console.log('Database connection test successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
} 