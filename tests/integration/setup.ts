import { execSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { afterAll, beforeAll } from "vitest"
import { GenericContainer, Wait } from "testcontainers"

let container: Awaited<ReturnType<typeof GenericContainer.prototype.start>> | undefined

beforeAll(async () => {
  const dbName = `memora_test_${randomUUID().replace(/-/g, "")}`
  container = await new GenericContainer("postgres:16-alpine")
    .withEnvironment({
      POSTGRES_DB: dbName,
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "postgres",
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forLogMessage("database system is ready to accept connections"),
    )
    .start()

  const host = container.getHost()
  const port = container.getMappedPort(5432)
  const databaseUrl = `postgresql://postgres:postgres@${host}:${port}/${dbName}?schema=public`

  process.env.DATABASE_URL = databaseUrl
  process.env.DIRECT_URL = databaseUrl

  execSync("pnpm prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
    },
  })
}, 120000)

afterAll(async () => {
  await container?.stop()
})
