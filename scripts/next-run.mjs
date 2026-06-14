import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextBin)) {
  console.error("Next.js binary was not found. Run `cmd /c npm install --cache .npm-cache` first.");
  process.exit(1);
}

process.env.NEXT_TELEMETRY_DISABLED ||= "1";

if (process.platform === "win32") {
  process.env.NEXT_SWC_PATH ||= resolve(process.cwd(), ".next-swc");
  process.env.NEXT_TEST_WASM_DIR ||= resolve(
    process.cwd(),
    "node_modules",
    "@next",
    "swc-wasm-nodejs"
  );
}

const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
