/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['drizzle-orm', '@neondatabase/serverless'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET
  }
}

export default nextConfig