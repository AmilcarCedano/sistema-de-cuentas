import { PrismaClient } from "@prisma/client";

// Cliente Prisma - conecta a BD MySQL en server/.env
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
