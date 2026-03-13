import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import * as dotenv from 'dotenv';
dotenv.config();

const prismaClientSingleton = () => {
  const adapter = new PrismaLibSql({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return new PrismaClient({ adapter })
}

const db = globalThis.prismaGlobal ?? prismaClientSingleton()

export { db }

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db
