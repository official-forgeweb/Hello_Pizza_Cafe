import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Define a type for our extended Prisma client to avoid typescript compilation issues
type ExtendedPrismaClient = ReturnType<typeof getExtendedClient>;

declare global {
  var prismaGlobal: undefined | ExtendedPrismaClient
  var pgPoolGlobal: undefined | Pool
}

const getExtendedClient = (client: PrismaClient) => {
  return client.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        let attempts = 0;
        const maxAttempts = 3;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        while (true) {
          try {
            return await query(args);
          } catch (error: any) {
            attempts++;
            
            // Connection/unreachable errors to retry:
            // - P1001: Can't reach database server
            // - P1002: Connection timed out
            // - P1008: Operations timed out
            // - pg connection terminated / pool errors
            const isConnectionError =
              error.code === 'P1001' ||
              error.code === 'P1002' ||
              error.code === 'P1008' ||
              error.message?.includes('Connection terminated unexpectedly') ||
              error.message?.includes('DatabaseNotReachable') ||
              error.message?.includes('pooler') ||
              error.message?.includes('connection') ||
              error.message?.includes('terminated') ||
              error.message?.includes('Failed to fetch') ||
              error.message?.includes('socket') ||
              error.message?.includes('ECONNRESET') ||
              error.message?.includes('ETIMEDOUT');

            if (isConnectionError && attempts < maxAttempts) {
              console.warn(
                `[Prisma Query Retry] Attempt ${attempts}/${maxAttempts} failed for ${model || 'system'}.${operation}. Retrying in ${attempts * 1000}ms... Error:`,
                error.message || error
              );
              await delay(attempts * 1000);
            } else {
              throw error;
            }
          }
        }
      },
    },
  });
};

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
      idleTimeoutMillis: 10000,     // Close idle connections faster (10s)
      connectionTimeoutMillis: 30000, // Wait up to 30s for database connection
    });

    // Handle unexpected errors on idle pool clients gracefully (e.g. during network dropouts)
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client:', err);
    });

    if (process.env.NODE_ENV !== 'production') {
      globalThis.pgPoolGlobal = pool;
    }
  }

  const adapter = new PrismaPg(pool)
  const baseClient = new PrismaClient({ adapter })
  const client = getExtendedClient(baseClient)

  if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = client;
  }

  return client;
}

const prisma = getPrismaClient()

export default prisma


