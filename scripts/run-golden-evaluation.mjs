import { spawn } from "node:child_process";

const child = spawn("pnpm", ["exec", "tsx", "server/nexus/goldenEvaluation.ts"], {
  cwd: new URL("..", import.meta.url),
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
