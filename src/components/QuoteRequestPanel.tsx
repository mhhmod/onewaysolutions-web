"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Send, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useQuote } from "@/components/QuoteProvider";
import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";
import type { QuoteRequestPayload } from "@/lib/types";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function QuoteRequestPanel() {
  const { items, clearQuote, removeItem, updateNotes, updateQuantity } = useQuote();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (items.length === 0) {
      setStatus("error");
      setMessage("Add at least one catalog item before sending a quote request.");
      return;
    }

    if (!hasSupabaseConfig) {
      setStatus("error");
      setMessage(
        "Missing Supabase environment values. Create .env.local from .env.example, then restart the dev server."
      );
      return;
    }

    const payload: QuoteRequestPayload = {
      customer_name: formValue(formData, "customer_name"),
      company_name: formValue(formData, "company_name"),
      email: formValue(formData, "email") || null,
      phone: formValue(formData, "phone"),
      project_location: formValue(formData, "project_location") || null,
      message: formValue(formData, "message") || null,
      items,
      source: "website",
      status: "new"
    };

    setStatus("submitting");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("quote_requests").insert(payload);

      if (error) {
        throw error;
      }

      setStatus("success");
      setMessage("Quote request sent. One Way Solutions will contact you with the next step.");
      clearQuote();
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit the quote request.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent">Selected items</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-primary md:text-5xl">
              Quote request
            </h1>
          </div>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-bold text-primary transition hover:border-primary/30 hover:bg-muted"
          >
            Browse catalog
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center">
            <h2 className="text-xl font-bold text-primary">No items selected yet</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-steel">
              Open the catalog, add the products you need, then return here to fill your details once.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <article
                key={item.slug}
                className="grid gap-4 rounded-lg border border-border bg-surface p-3 shadow-sm sm:grid-cols-[112px_minmax(0,1fr)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                  <Image src={item.imagePath} alt={item.name} fill className="object-contain p-2" />
                </div>
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                        {item.categoryName}
                      </p>
                      <h2 className="mt-1 text-base font-bold text-primary">{item.name}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-danger transition hover:bg-danger hover:text-white"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
                    <label className="grid gap-1 text-sm font-semibold text-primary">
                      Quantity
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.slug, Number(event.target.value))}
                        className="min-h-11 rounded-md border border-border bg-white px-3 text-sm outline-none transition focus:border-accent"
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-primary">
                      Item notes
                      <input
                        value={item.notes ?? ""}
                        onChange={(event) => updateNotes(item.slug, event.target.value)}
                        placeholder="Model, size, brand, or project detail"
                        className="min-h-11 rounded-md border border-border bg-white px-3 text-sm outline-none transition placeholder:text-steel/70 focus:border-accent"
                      />
                    </label>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-border bg-surface p-5 shadow-industrial">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent">Contact details</p>
            <h2 className="mt-2 text-2xl font-black text-primary">Send request</h2>
            <p className="mt-2 text-sm leading-6 text-steel">
              No prices are shown online. The team will review the selected items and respond with availability and quotation details.
            </p>
          </div>

          <label className="grid gap-1 text-sm font-semibold text-primary">
            Full name
            <input name="customer_name" required minLength={2} className="min-h-11 rounded-md border border-border px-3 outline-none focus:border-accent" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-primary">
            Company name
            <input name="company_name" required minLength={2} className="min-h-11 rounded-md border border-border px-3 outline-none focus:border-accent" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-primary">
            Phone
            <input name="phone" required minLength={7} inputMode="tel" className="min-h-11 rounded-md border border-border px-3 outline-none focus:border-accent" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-primary">
            Email
            <input name="email" type="email" className="min-h-11 rounded-md border border-border px-3 outline-none focus:border-accent" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-primary">
            Project location
            <input name="project_location" className="min-h-11 rounded-md border border-border px-3 outline-none focus:border-accent" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-primary">
            Message
            <textarea
              name="message"
              rows={4}
              className="resize-y rounded-md border border-border px-3 py-3 outline-none focus:border-accent"
            />
          </label>

          <button
            type="submit"
            disabled={status === "submitting" || items.length === 0}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-black text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-steel/45"
          >
            {status === "success" ? <CheckCircle2 size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            {status === "submitting" ? "Sending..." : "Send quote request"}
          </button>

          {message ? (
            <p
              className={`rounded-md p-3 text-sm leading-6 ${
                status === "success"
                  ? "bg-success/10 text-primary"
                  : "bg-danger/10 text-danger"
              }`}
            >
              {message}
            </p>
          ) : null}
        </form>
      </aside>
    </div>
  );
}
