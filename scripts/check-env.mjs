import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const fileName of [".env", ".env.local"]) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    continue;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");

    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}

const requiredForLiveOps = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
];

const missing = requiredForLiveOps.filter((key) => !process.env[key]);
const malformed = [];

if (
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(process.env.NEXT_PUBLIC_SUPABASE_URL)
) {
  malformed.push("NEXT_PUBLIC_SUPABASE_URL must look like https://<project-ref>.supabase.co");
}

if (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  !/^sb_publishable_|^eyJ/.test(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
) {
  malformed.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be a Supabase publishable or legacy anon key");
}

if (missing.length || malformed.length) {
  console.warn("\nEnvironment check warning:");
  for (const key of missing) {
    console.warn(`- Missing ${key}. Quote submission and admin login will not work until it is set.`);
  }
  for (const issue of malformed) {
    console.warn(`- ${issue}.`);
  }
  console.warn("Catalog browsing can still build from local assets.\n");
} else {
  console.log("Environment check passed.");
}
