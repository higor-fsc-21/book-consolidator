import { PrismaClient } from "@prisma/client"

let prismaInstance: PrismaClient | null = null

export function getTestDb(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
  }
  return prismaInstance
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getTestDb()
    const val = (client as any)[prop]
    if (typeof val === "function") {
      return val.bind(client)
    }
    return val
  },
})
