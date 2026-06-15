"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { cn } from "@/lib/cn";

type Status = "idle" | "submitting" | "resetting" | "error" | "sent";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseConfig) {
      setStatus("error");
      setMessage("Sign-in is not available right now. Please contact your administrator.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.push("/admin");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("We could not sign you in. Check your email and password, then try again.");
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setStatus("error");
      setMessage("Enter your email above, then choose reset.");
      return;
    }
    if (!hasSupabaseConfig) {
      setStatus("error");
      setMessage("Password reset is not available right now. Please contact your administrator.");
      return;
    }

    setStatus("resetting");
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/reset`
      });
    } catch {
      // Intentionally ignored: never reveal whether an account exists.
    }
    setStatus("sent");
    setMessage("If an account exists for that email, a reset link is on its way.");
  }

  const isBusy = status === "submitting" || status === "resetting";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-industrial">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
        <LockKeyhole size={22} aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-primary">Admin login</h1>
        <p className="mt-2 text-sm leading-6 text-steel">Sign in with your One Way Solutions admin account.</p>
      </div>

      <label className="grid gap-1.5 text-sm font-medium text-primary">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-11 rounded-md border border-border bg-white px-3 outline-none transition focus:border-accent"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-primary">
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-11 rounded-md border border-border bg-white px-3 outline-none transition focus:border-accent"
        />
      </label>

      <button
        type="submit"
        disabled={isBusy}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-bold text-white transition hover:bg-accent/90 active:translate-y-px disabled:cursor-not-allowed disabled:bg-steel/45"
      >
        <LogIn size={18} aria-hidden="true" />
        {status === "submitting" ? "Signing in..." : "Sign in"}
      </button>

      <button
        type="button"
        onClick={handleReset}
        disabled={isBusy}
        className="inline-flex min-h-11 justify-self-start items-center rounded-md pr-3 text-sm font-medium text-steel underline-offset-4 transition hover:text-primary hover:underline disabled:opacity-60"
      >
        {status === "resetting" ? "Sending reset link..." : "Forgot password?"}
      </button>

      {message ? (
        <p
          className={cn(
            "rounded-md p-3 text-sm leading-6",
            status === "sent" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
