import { AlertTriangle } from "lucide-react";
import { hasSupabaseConfig } from "@/lib/supabase";

export function EnvNotice({ mode }: { mode: "quote" | "admin" }) {
  if (hasSupabaseConfig) {
    return null;
  }

  const copy =
    mode === "quote"
      ? "Quote submission is not connected yet because .env.local is missing the public Supabase URL and publishable key."
      : "Admin login is not connected yet because .env.local is missing the public Supabase URL and publishable key.";

  return (
    <div className="flex gap-3 rounded-lg border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-primary">
      <AlertTriangle className="mt-0.5 shrink-0 text-warning" size={18} aria-hidden="true" />
      <p>{copy}</p>
    </div>
  );
}
