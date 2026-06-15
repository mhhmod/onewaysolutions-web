"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import { ToastProvider } from "@/components/admin/ui/Toast";

type GateState = "checking" | "missing-env" | "signed-out" | "unauthorized" | "ready";

type AdminProfile = {
  fullName: string;
  role: string;
};

type AdminContextValue = {
  profile: AdminProfile;
  signOut: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [gateState, setGateState] = useState<GateState>("checking");
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (!hasSupabaseConfig) {
        if (active) setGateState("missing-env");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        if (active) setGateState("signed-out");
        return;
      }

      const { data: profileRow, error } = await supabase
        .from("admin_profiles")
        .select("full_name,role,is_active")
        .eq("user_id", data.session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !profileRow?.is_active) {
        setGateState("unauthorized");
        return;
      }

      setProfile({
        fullName: profileRow.full_name ?? data.session.user.email ?? "Admin",
        role: profileRow.role ?? "admin"
      });
      setGateState("ready");
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    if (hasSupabaseConfig) {
      await getSupabaseBrowserClient().auth.signOut();
    }
    setProfile(null);
    setGateState("signed-out");
  }

  if (gateState !== "ready" || !profile) {
    return <GateScreen state={gateState} />;
  }

  return (
    <AdminContext.Provider value={{ profile, signOut }}>
      <ToastProvider>{children}</ToastProvider>
    </AdminContext.Provider>
  );
}

function GateScreen({ state }: { state: GateState }) {
  if (state === "checking") {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-background px-4 text-steel">
        <div className="flex items-center gap-3 text-sm font-medium">
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          Confirming your access.
        </div>
      </div>
    );
  }

  const copy: Record<Exclude<GateState, "checking">, { title: string; text: string }> = {
    "missing-env": {
      title: "Dashboard is not available",
      text: "The dashboard is not available right now. Please try again later or contact your administrator."
    },
    "signed-out": {
      title: "Sign in required",
      text: "Sign in with your One Way Solutions admin account to manage the catalog and quote requests."
    },
    unauthorized: {
      title: "Access not granted",
      text: "You are signed in, but your account has not been granted dashboard access yet. Contact your administrator."
    },
    ready: {
      title: "Sign in required",
      text: "Sign in with your One Way Solutions admin account to manage the catalog and quote requests."
    }
  };

  const { title, text } = copy[state];

  return (
    <div className="mx-auto grid min-h-[100svh] max-w-xl content-center gap-5 px-4">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-industrial">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
          <ShieldAlert size={22} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-primary">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-steel">{text}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/login"
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            Open sign in
          </Link>
          <Link
            href={process.env.NEXT_PUBLIC_SITE_URL ?? "/"}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary transition hover:bg-muted"
          >
            Public site
          </Link>
        </div>
      </div>
    </div>
  );
}
