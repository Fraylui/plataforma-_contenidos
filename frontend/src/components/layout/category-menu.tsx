"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/lib/api/types";

export function CategoryMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 rounded-md px-2 py-3 text-sm font-medium text-background/75 transition-colors hover:text-background"
      >
        Categorías
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-30 mt-1 w-[28rem] max-w-[90vw] -translate-x-1/2 rounded-lg border border-border bg-surface p-4 shadow-lg"
          >
            <div className="flex flex-wrap gap-2">
              {sorted.map((category) => (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug}`}
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                >
                  {category.name}
                </Link>
              ))}
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <Link
                href="/categorias"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-accent hover:underline"
              >
                Ver todas las categorías →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
