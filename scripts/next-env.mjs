// Loads .env before choosing the port, so a worktree's PORT wins over the 8443 default.
import { spawn } from "node:child_process";

try {
  process.loadEnvFile(".env");
} catch {}

const [mode = "dev"] = process.argv.slice(2);
const port = process.env.PORT ?? "8443";

const child = spawn("next", [mode, "-p", port], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 0));
