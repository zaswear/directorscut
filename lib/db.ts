import { PrismaClient } from "@prisma/client";
import { createClient as createLibSqlClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql"; // 1. Cambiado a PrismaLibSql (con 'q' minúscula)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  // Producción: Si estamos en Vercel y tenemos las variables de Turso
  if (process.env.TURSO_DATABASE_URL && process.env.NODE_ENV === "production") {
    const libsql = createLibSqlClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    
    const adapter = new PrismaLibSql(libsql); // 2. Cambiado aquí también
    return new PrismaClient({ adapter });
  }

  // Desarrollo / Fallback: SQLite local
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;