import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { EnvNotice } from "@/components/EnvNotice";

export const metadata = {
  title: "Admin Login"
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container-shell grid min-h-screen content-center gap-5 py-8">
        <Link
          href="/"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-black text-primary hover:bg-muted"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Public site
        </Link>
        <div className="mx-auto grid w-full max-w-md gap-4">
          <EnvNotice mode="admin" />
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
