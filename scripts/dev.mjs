// Starts the API (port 4000) and the web app (port 3000) together for local development.
// Ctrl+C stops both.
import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const procs = [
  ["api", ["run", "dev", "--workspace", "@billingease/api"]],
  ["web", ["run", "dev", "--workspace", "@billingease/web"]],
].map(([name, args]) => {
  const p = spawn(npm, args, { stdio: ["ignore", "pipe", "pipe"], env: process.env, shell: process.platform === "win32" });
  const tag = name === "api" ? "\x1b[35m[api]\x1b[0m " : "\x1b[36m[web]\x1b[0m ";
  const pipe = (src, dst) => src.on("data", (d) => String(d).split(/\r?\n/).filter(Boolean).forEach((l) => dst.write(tag + l + "\n")));
  pipe(p.stdout, process.stdout);
  pipe(p.stderr, process.stderr);
  p.on("exit", (code) => { console.log(`${tag}stopped (${code ?? "signal"})`); stop(); });
  return p;
});

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const p of procs) if (p.exitCode === null) p.kill("SIGTERM");
  setTimeout(() => process.exit(0), 1500);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
console.log("Starting BillingEase: web app http://localhost:3000 · API http://localhost:4000");
