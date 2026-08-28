"use client";

import { useState } from "react";
import type { PlatformSettings } from "@/lib/api/types";
import type { PlatformSettingsInput } from "@/lib/api/admin-types";
import { updatePlatformSettingsAction } from "@/app/admin/(protected)/configuracion/actions";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";
import { isValidHexColor } from "@/lib/theme";

type FormState = {
  [K in keyof PlatformSettingsInput]: PlatformSettingsInput[K] extends boolean ? boolean : string;
};

function toFormState(settings: PlatformSettings): FormState {
  return {
    name: settings.name,
    shortName: settings.shortName ?? "",
    description: settings.description ?? "",
    slogan: settings.slogan ?? "",
    logoUrl: settings.logoUrl ?? "",
    logoDarkUrl: settings.logoDarkUrl ?? "",
    faviconUrl: settings.faviconUrl ?? "",
    ogImageUrl: settings.ogImageUrl ?? "",
    primaryColor: settings.primaryColor ?? "",
    secondaryColor: settings.secondaryColor ?? "",
    backgroundColor: settings.backgroundColor ?? "",
    fontFamily: settings.fontFamily ?? "",
    theme: settings.theme,
    seoDefaultTitle: settings.seoDefaultTitle ?? "",
    seoDefaultDescription: settings.seoDefaultDescription ?? "",
    seoDefaultImageUrl: settings.seoDefaultImageUrl ?? "",
    googleSearchConsoleVerification: settings.googleSearchConsoleVerification ?? "",
    facebookUrl: settings.facebookUrl ?? "",
    instagramUrl: settings.instagramUrl ?? "",
    tiktokUrl: settings.tiktokUrl ?? "",
    youtubeUrl: settings.youtubeUrl ?? "",
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
    contactAddress: settings.contactAddress ?? "",
    adsenseEnabled: settings.adsenseEnabled,
    adsenseClientId: settings.adsenseClientId ?? "",
    analyticsId: settings.analyticsId ?? "",
    adsenseSlotArticle: settings.adsenseSlotArticle ?? "",
    adsenseSlotListing: settings.adsenseSlotListing ?? "",
  };
}

function toInput(state: FormState): PlatformSettingsInput {
  const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim());
  return {
    name: state.name.trim(),
    shortName: blankToNull(state.shortName),
    description: blankToNull(state.description),
    slogan: blankToNull(state.slogan),
    logoUrl: blankToNull(state.logoUrl),
    logoDarkUrl: blankToNull(state.logoDarkUrl),
    faviconUrl: blankToNull(state.faviconUrl),
    ogImageUrl: blankToNull(state.ogImageUrl),
    primaryColor: blankToNull(state.primaryColor),
    secondaryColor: blankToNull(state.secondaryColor),
    backgroundColor: blankToNull(state.backgroundColor),
    fontFamily: blankToNull(state.fontFamily),
    theme: state.theme as PlatformSettingsInput["theme"],
    seoDefaultTitle: blankToNull(state.seoDefaultTitle),
    seoDefaultDescription: blankToNull(state.seoDefaultDescription),
    seoDefaultImageUrl: blankToNull(state.seoDefaultImageUrl),
    googleSearchConsoleVerification: blankToNull(state.googleSearchConsoleVerification),
    facebookUrl: blankToNull(state.facebookUrl),
    instagramUrl: blankToNull(state.instagramUrl),
    tiktokUrl: blankToNull(state.tiktokUrl),
    youtubeUrl: blankToNull(state.youtubeUrl),
    contactEmail: blankToNull(state.contactEmail),
    contactPhone: blankToNull(state.contactPhone),
    contactAddress: blankToNull(state.contactAddress),
    adsenseEnabled: state.adsenseEnabled,
    adsenseClientId: blankToNull(state.adsenseClientId),
    analyticsId: blankToNull(state.analyticsId),
    adsenseSlotArticle: blankToNull(state.adsenseSlotArticle),
    adsenseSlotListing: blankToNull(state.adsenseSlotListing),
  };
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <FormField label={label}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={formInputClass} />
    </FormField>
  );
}

/**
 * Selector de color real (no texto libre): el campo veía guardarse basura
 * como "rojo" en vez de un hex, lo que rompía la variable CSS que lo
 * consume en el sitio (ver lib/theme.ts, isValidHexColor). El input de
 * texto queda al lado para copiar/pegar un hex exacto si se prefiere.
 */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const swatch = isValidHexColor(value) ? value : "#000000";
  return (
    <FormField label={label}>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={swatch}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#B91C1C"
          className={formInputClass.replace("mt-1 ", "")}
        />
      </div>
    </FormField>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-medium text-foreground">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function PlatformSettingsForm({ settings }: { settings: PlatformSettings }) {
  const [state, setState] = useState<FormState>(() => toFormState(settings));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updatePlatformSettingsAction(toInput(state));
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedAt(Date.now());
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Section title="Identidad">
        <TextField label="Nombre de la plataforma" value={state.name} onChange={(v) => set("name", v)} />
        <TextField label="Nombre corto" value={state.shortName} onChange={(v) => set("shortName", v)} />
        <TextField label="Slogan" value={state.slogan} onChange={(v) => set("slogan", v)} />
        <TextField label="Logo (URL)" value={state.logoUrl} onChange={(v) => set("logoUrl", v)} />
        <TextField label="Logo modo oscuro (URL)" value={state.logoDarkUrl} onChange={(v) => set("logoDarkUrl", v)} />
        <TextField label="Favicon (URL)" value={state.faviconUrl} onChange={(v) => set("faviconUrl", v)} />
        <TextField
          label="Imagen para compartir / Open Graph (URL)"
          value={state.ogImageUrl}
          onChange={(v) => set("ogImageUrl", v)}
        />
        <FormField label="Descripción">
          <textarea
            value={state.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className={formInputClass}
          />
        </FormField>
      </Section>

      <Section title="Apariencia">
        <ColorField label="Color principal" value={state.primaryColor} onChange={(v) => set("primaryColor", v)} />
        <ColorField label="Color secundario" value={state.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
        <ColorField label="Color de fondo" value={state.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
        <TextField label="Tipografía" value={state.fontFamily} onChange={(v) => set("fontFamily", v)} />
        <FormField label="Tema">
          <select
            value={state.theme}
            onChange={(e) => set("theme", e.target.value as FormState["theme"])}
            className={formInputClass}
          >
            <option value="AUTO">Auto (según el sistema)</option>
            <option value="LIGHT">Claro</option>
            <option value="DARK">Oscuro</option>
          </select>
        </FormField>
      </Section>

      <Section title="SEO por defecto">
        <TextField label="Título por defecto" value={state.seoDefaultTitle} onChange={(v) => set("seoDefaultTitle", v)} />
        <TextField
          label="Imagen social por defecto (URL)"
          value={state.seoDefaultImageUrl}
          onChange={(v) => set("seoDefaultImageUrl", v)}
        />
        <FormField label="Meta descripción por defecto">
          <textarea
            value={state.seoDefaultDescription}
            onChange={(e) => set("seoDefaultDescription", e.target.value)}
            rows={2}
            className={formInputClass}
          />
        </FormField>
        <TextField
          label="Google Search Console (verificación)"
          value={state.googleSearchConsoleVerification}
          onChange={(v) => set("googleSearchConsoleVerification", v)}
        />
      </Section>

      <Section title="Redes sociales">
        <TextField label="Facebook" value={state.facebookUrl} onChange={(v) => set("facebookUrl", v)} />
        <TextField label="Instagram" value={state.instagramUrl} onChange={(v) => set("instagramUrl", v)} />
        <TextField label="TikTok" value={state.tiktokUrl} onChange={(v) => set("tiktokUrl", v)} />
        <TextField label="YouTube" value={state.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} />
      </Section>

      <Section title="Contacto">
        <TextField
          label="Correo de contacto"
          type="email"
          value={state.contactEmail}
          onChange={(v) => set("contactEmail", v)}
        />
        <TextField label="Teléfono" value={state.contactPhone} onChange={(v) => set("contactPhone", v)} />
        <TextField label="Dirección" value={state.contactAddress} onChange={(v) => set("contactAddress", v)} />
      </Section>

      <Section title="Monetización">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={state.adsenseEnabled}
            onChange={(e) => set("adsenseEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          AdSense habilitado
        </label>
        <TextField
          label="AdSense Client ID"
          value={state.adsenseClientId}
          onChange={(v) => set("adsenseClientId", v)}
        />
        <TextField label="Analytics ID" value={state.analyticsId} onChange={(v) => set("analyticsId", v)} />
        <TextField
          label="Slot de anuncio — detalle de contenido"
          value={state.adsenseSlotArticle}
          onChange={(v) => set("adsenseSlotArticle", v)}
        />
        <TextField
          label="Slot de anuncio — listados"
          value={state.adsenseSlotListing}
          onChange={(v) => set("adsenseSlotListing", v)}
        />
      </Section>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {savedAt && !error && (
        <p role="status" className="text-sm text-accent">
          Guardado.
        </p>
      )}

      <AdminButton type="submit" disabled={pending || !state.name.trim()}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </AdminButton>
    </form>
  );
}
