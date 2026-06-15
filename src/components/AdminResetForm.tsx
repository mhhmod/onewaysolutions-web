"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { cn } from "@/lib/cn";

type Phase = "checking" | "ready" | "invalid" | "done";

export function AdminResetForm() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setPhase("invalid");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let settled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        settled = true;
        setPhase("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true;
        setPhase("ready");
      }
    });

    const fallback = window.setTimeout(() => {
      if (!settled) setPhase("invalid");
    }, 1500);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearTimeout(fallback);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      setPhase("done");
    } catch {
      setError("We could not update your password. Request a new reset link and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "checking") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-6 text-sm text-steel shadow-industrial">
        <Loader2 className="animate-spin" size={18} aria-hidden="true" />
        Checking your reset link.
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <div className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-industrial">
        <h1 className="text-2xl font-bold text-primary">Reset link expired</h1>
        <p className="text-sm leading-6 text-steel">
          This password reset link is no longer valid. Request a new one from the sign-in page.
        </p>
        <Link
          href="/admin/login"
          className="inline-flex min-h-11 w-fit items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition hover:bg-accent/90"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-industrial">
        <h1 className="text-2xl font-bold text-primary">Password updated</h1>
        <p className="text-sm leading-6 text-steel">Your password has been changed. You can sign in now.</p>
        <Link
          href="/admin"
          className="inline-flex min-h-11 w-fit items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition hover:bg-accent/90"
        >
          Continue to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-border bg-surface p-6 shadow-industrial">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
        <KeyRound size={22} aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-primary">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-steel">Choose a new password for your admin account.</p>
      </div>

      <label className="grid gap-1.5 text-sm font-medium text-primary">
        New password
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-11 rounded-md border border-border bg-white px-3 outline-none transition focus:border-accent"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-primary">
        Confirm password
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="min-h-11 rounded-md border border-border bg-white px-3 outline-none transition focus:border-accent"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-bold text-white transition hover:bg-accent/90 active:translate-y-px",
          submitting && "cursor-not-allowed opacity-70"
        )}
      >
        {submitting ? "Updating..." : "Update password"}
      </button>

      {error ? <p className="rounded-md bg-danger/10 p-3 text-sm leading-6 text-danger">{error}</p> : null}
    </form>
  );
}
