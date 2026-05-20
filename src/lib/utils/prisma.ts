/**
 * Prisma Client Singleton Utility
 * ------------------------------
 * Ensures a single instance of PrismaClient is used throughout the application, especially in development
 * with Next.js where hot reloading can cause multiple instances. This prevents connection leaks and improves
 * performance and reliability.
 *
 * Responsibilities:
 * - Provide a singleton PrismaClient instance
 * - Log queries for debugging
 * - Attach the instance to the global object in non-production environments
 *
 * The exported prisma object is used for all database operations.
 */
import { PrismaClient } from '@/generated/prisma'
import '@/lib/env' // Validate required environment variables at startup

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma