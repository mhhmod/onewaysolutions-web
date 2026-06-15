import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminResetForm } from "@/components/AdminResetForm";

export const metadata = {
  title: "Reset password"
};

export default function AdminResetPage() {
  return (
    <main className="min-h-[100svh] bg-background">
      <div className="container-shell grid min-h-[100svh] content-center gap-5 py-8">
        <Link
          href="/admin/login"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary hover:bg-muted"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to sign in
        </Link>
        <div className="mx-auto grid w-full max-w-md gap-4">
          <AdminResetForm />
        </div>
      </div>
    </main>
  );
}
