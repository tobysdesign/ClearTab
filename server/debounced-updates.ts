import { Redis } from '@upstash/redis'
import { type Note } from '@/shared/schema'

// Initialize Redis client if configuration is available
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

const DEBOUNCE_TIME = 1000 // 1 second
const NOTE_LOCK_PREFIX = 'note-lock:'
const NOTE_QUEUE_PREFIX = 'note-queue:'

interface QueuedUpdate {
  noteId: string
  userId: string
  data: Partial<Note>
  timestamp: number
}

export async function shouldProcessUpdate(noteId: string, userId: string): Promise<boolean> {
  if (!redis) return true // If Redis is not configured, always process updates

  const lockKey = `${NOTE_LOCK_PREFIX}${userId}:${noteId}`
  const queueKey = `${NOTE_QUEUE_PREFIX}${userId}:${noteId}`

  try {
    // Check if there's a lock
    const lastUpdate = await redis.get<number>(lockKey)
    const now = Date.now()

    if (!lastUpdate || (now - lastUpdate) > DEBOUNCE_TIME) {
      // Set the lock with current timestamp
      await redis.set(lockKey, now, { ex: 5 }) // 5 second expiry for safety
      
      // Get and clear any queued updates
      const queuedUpdates = await redis.get<QueuedUpdate[]>(queueKey)
      await redis.del(queueKey)
      
      return true
    }

    return false
  } catch (error) {
    console.error('Redis error in shouldProcessUpdate:', error)
    return true // On Redis error, process the update
  }
}

export async function queueUpdate(noteId: string, userId: string, data: Partial<Note>): Promise<void> {
  if (!redis) return // If Redis is not configured, skip queueing

  try {
    const queueKey = `${NOTE_QUEUE_PREFIX}${userId}:${noteId}`
    
    const update: QueuedUpdate = {
      noteId,
      userId,
      data,
      timestamp: Date.now()
    }

    await redis.set(queueKey, update, { ex: 10 }) // 10 second expiry for safety
  } catch (error) {
    console.error('Redis error in queueUpdate:', error)
  }
}

export async function getQueuedUpdate(noteId: string, userId: string): Promise<QueuedUpdate | null> {
  if (!redis) return null // If Redis is not configured, return null

  try {
    const queueKey = `${NOTE_QUEUE_PREFIX}${userId}:${noteId}`
    return await redis.get<QueuedUpdate>(queueKey)
  } catch (error) {
    console.error('Redis error in getQueuedUpdate:', error)
    return null
  }
} 