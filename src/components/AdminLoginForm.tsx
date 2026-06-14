"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";

export function AdminLoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseConfig) {
      setStatus("error");
      setMessage("Missing Supabase environment values. Create .env.local from .env.example.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setStatus("submitting");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not sign in.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-industrial">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-white">
        <LockKeyhole size={22} aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-3xl font-black text-primary">Admin login</h1>
        <p className="mt-2 text-sm leading-6 text-steel">
          Use a Supabase user that has an active row in <span className="font-semibold text-primary">admin_profiles</span>.
        </p>
      </div>

      <label className="grid gap-1 text-sm font-semibold text-primary">
        Email
        <input
          name="email"
          type="email"
          required
          className="min-h-11 rounded-md border border-border px-3 outline-none focus:border-accent"
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-primary">
        Password
        <input
          name="password"
          type="password"
          required
          className="min-h-11 rounded-md border border-border px-3 outline-none focus:border-accent"
        />
      </label>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-black text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-steel/45"
      >
        <LogIn size={18} aria-hidden="true" />
        {status === "submitting" ? "Signing in..." : "Sign in"}
      </button>
      {message ? <p className="rounded-md bg-danger/10 p-3 text-sm leading-6 text-danger">{message}</p> : null}
    </form>
  );
}
