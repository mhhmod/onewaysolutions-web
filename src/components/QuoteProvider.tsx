"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Product, QuoteItem } from "@/lib/types";

type QuoteContextValue = {
  items: QuoteItem[];
  itemCount: number;
  addProduct: (product: Product) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  updateNotes: (slug: string, notes: string) => void;
  clearQuote: () => void;
};

const QuoteContext = createContext<QuoteContextValue | undefined>(undefined);
const storageKey = "one-way-solutions-quote-v1";

function normalizeItems(value: unknown): QuoteItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Partial<QuoteItem>)
    .filter((item) => item.slug && item.name && item.categoryName && item.imagePath)
    .map((item) => ({
      slug: String(item.slug),
      name: String(item.name),
      categoryName: String(item.categoryName),
      imagePath: String(item.imagePath),
      quantity: Math.max(1, Number(item.quantity) || 1),
      notes: item.notes ? String(item.notes) : ""
    }));
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      setItems(saved ? normalizeItems(JSON.parse(saved)) : []);
    } catch {
      setItems([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [isReady, items]);

  const addProduct = useCallback((product: Product) => {
    setItems((current) => {
      const existing = current.find((item) => item.slug === product.slug);

      if (existing) {
        return current.map((item) =>
          item.slug === product.slug ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...current,
        {
          slug: product.slug,
          name: product.name,
          categoryName: product.categoryName,
          imagePath: product.imagePath,
          quantity: 1,
          notes: ""
        }
      ];
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((current) => current.filter((item) => item.slug !== slug));
  }, []);

  const updateQuantity = useCallback((slug: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.slug === slug ? { ...item, quantity: Math.max(1, Math.floor(quantity) || 1) } : item
      )
    );
  }, []);

  const updateNotes = useCallback((slug: string, notes: string) => {
    setItems((current) => current.map((item) => (item.slug === slug ? { ...item, notes } : item)));
  }, []);

  const clearQuote = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<QuoteContextValue>(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      addProduct,
      removeItem,
      updateQuantity,
      updateNotes,
      clearQuote
    }),
    [addProduct, clearQuote, items, removeItem, updateNotes, updateQuantity]
  );

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote() {
  const context = useContext(QuoteContext);

  if (!context) {
    throw new Error("useQuote must be used inside QuoteProvider");
  }

  return context;
}
