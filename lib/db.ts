import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  // Producción: Si estamos en Vercel y tenemos las variables de Turso
  if (process.env.TURSO_DATABASE_URL && process.env.NODE_ENV === "production") {
    const adapter = new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    
    // Doble casteo (as unknown as ...) para silenciar definitivamente a TypeScript
    return new PrismaClient({ 
      adapter 
    } as unknown as ConstructorParameters<typeof PrismaClient>[0]);
  }

  // Desarrollo / Fallback: SQLite local
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;