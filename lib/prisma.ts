import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

declare global {
  var prismaGlobal: undefined | PrismaClient
  var pgPoolGlobal: undefined | Pool
}

const getPrismaClient = () => {
  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("CRITICAL: DATABASE_URL is not defined in environment variables!");
  }

  // Reuse the pg connection pool across hot reloads to prevent connection exhaustion
  let pool = globalThis.pgPoolGlobal;
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 5,                       // Limit connections per pool in dev mode
      idleTimeoutMillis: 15000,     // Close idle connections faster (15s)
      connectionTimeoutMillis: 10000, // Timeout faster if database is unreachable
    });
    if (process.env.NODE_ENV !== 'production') {
      globalThis.pgPoolGlobal = pool;
    }
  }

  const adapter = new PrismaPg(pool)
  const client = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = client;
  }

  return client;
}

const prisma = getPrismaClient()

export default prisma

