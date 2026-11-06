"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash } from "@phosphor-icons/react";
import { saveAffiliateLinksAction } from "@/app/admin/(protected)/afiliados/actions";
import type { AffiliateContentType, AffiliateLink } from "@/lib/api/admin-types";
import { Button, Card, Field, IconButton, TextInput } from "@/components/ui";

const MAX_LINKS = 10;

interface Row {
  key: string;
  label: string;
  url: string;
  clicks: number | null;
}

let nextKey = 0;
const newKey = () => `nuevo-${nextKey++}`;

function toRows(links: AffiliateLink[]): Row[] {
  return links.map((link) => ({ key: link.id, label: link.label, url: link.url, clicks: link.clicks }));
}

/** Mismas reglas que AffiliateLinkService: nombre y dirección https:// con dominio. */
export function affiliateRowError(row: { label: string; url: string }): string | null {
  if (!row.label.trim()) return "Ponle un nombre (por ejemplo, «Tour a Machu Picchu»).";
  if (row.label.trim().length > 80) return "El nombre admite hasta 80 letras.";
  try {
    const url = new URL(row.url.trim());
    if (url.protocol !== "https:" || !url.hostname.includes(".") || /\s/.test(row.url.trim())) throw new Error();
  } catch {
    return "Pega el enlace completo que te dio el programa de afiliados (empieza con https://).";
  }
  return null;
}

/**
 * Enlaces de afiliado de una publicación o un lugar: un tour, un hotel, un
 * libro que recomiendas. En el sitio salen en «Recomendados» con la marca
 * «Enlace de afiliado» (D.Leg. 1044) y cada clic se cuenta.
 */
export function AffiliateLinksEditor({
  type,
  contentId,
  initialLinks,
}: {
  type: AffiliateContentType;
  contentId: string;
  initialLinks: AffiliateLink[];
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initialLinks));
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [pending, startTransition] = useTransition();

  function update(index: number, patch: Partial<Row>) {
    setMessage(null);
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function move(index: number, delta: number) {
    setRows((current) => {
      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(index + delta, 0, row);
      return next;
    });
  }

  function save() {
    if (rows.some((row) => affiliateRowError(row))) {
      setShowErrors(true);
      setMessage({ tone: "error", text: "Revisa los enlaces marcados." });
      return;
    }
    startTransition(async () => {
      const result = await saveAffiliateLinksAction(
        type,
        contentId,
        rows.map((row) => ({ label: row.label.trim(), url: row.url.trim() })),
      );
      if (result.ok) {
        setRows(toRows(result.data));
        setShowErrors(false);
        setMessage({ tone: "ok", text: "Enlaces guardados." });
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  return (
    <Card
      title="Enlaces de afiliado (opcional)"
      description="Recomienda un tour, un hotel o un producto con tu enlace de afiliado: si alguien compra, ganas una comisión. En el sitio aparecen en «Recomendados» con la marca «Enlace de afiliado», como pide la ley. Recomienda solo lo que de verdad usarías."
    >
      {rows.length > 0 && (
        <ol className="space-y-4">
          {rows.map((row, index) => {
            const error = showErrors ? affiliateRowError(row) : null;
            return (
              <li key={row.key} className="rounded-card border border-border p-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                  <Field label="Nombre" name={`afiliado-nombre-${index}`}>
                    <TextInput
                      value={row.label}
                      maxLength={80}
                      placeholder="Tour a Machu Picchu"
                      onChange={(event) => update(index, { label: event.target.value })}
                    />
                  </Field>
                  <Field label="Enlace" name={`afiliado-enlace-${index}`} error={error ?? undefined}>
                    <TextInput
                      type="url"
                      inputMode="url"
                      value={row.url}
                      placeholder="https://…"
                      invalid={Boolean(error)}
                      onChange={(event) => update(index, { url: event.target.value })}
                    />
                  </Field>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    {row.clicks === null ? "Nuevo: guarda para activarlo" : `${row.clicks} ${row.clicks === 1 ? "clic" : "clics"}`}
                  </p>
                  <div className="flex items-center gap-1">
                    <IconButton label="Subir" size="sm" icon={<ArrowUp aria-hidden="true" />} disabled={index === 0} onClick={() => move(index, -1)} />
                    <IconButton label="Bajar" size="sm" icon={<ArrowDown aria-hidden="true" />} disabled={index === rows.length - 1} onClick={() => move(index, 1)} />
                    <IconButton
                      label="Quitar enlace"
                      size="sm"
                      icon={<Trash aria-hidden="true" />}
                      onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          icon={<Plus aria-hidden="true" />}
          disabled={rows.length >= MAX_LINKS}
          onClick={() => setRows((current) => [...current, { key: newKey(), label: "", url: "", clicks: null }])}
        >
          Agregar enlace
        </Button>
        <Button onClick={save} loading={pending}>
          Guardar enlaces
        </Button>
        {message && (
          <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-sm text-danger-ink" : "text-sm text-success"}>
            {message.text}
          </p>
        )}
      </div>
    </Card>
  );
}
