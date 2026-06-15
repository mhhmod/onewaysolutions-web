"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { BrandsManager } from "@/components/admin/BrandsManager";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

const tabs = [
  { key: "categories", label: "Categories" },
  { key: "brands", label: "Brands" }
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function TaxonomyManager() {
  const [tab, setTab] = useState<TabKey>("categories");

  return (
    <div className="grid gap-5">
      <div className="inline-flex w-fit rounded-lg border border-border bg-surface p-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            aria-pressed={tab === item.key}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold transition",
              tab === item.key ? "bg-primary text-white" : "text-steel hover:text-primary"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "categories" ? <CategoriesManager /> : <BrandsManager />}
    </div>
  );
}
