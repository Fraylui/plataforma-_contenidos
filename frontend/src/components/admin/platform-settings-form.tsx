"use client";

import { useState } from "react";
import type { PlatformSettings } from "@/lib/api/types";
import type { PlatformSettingsInput } from "@/lib/api/admin-types";
import { updatePlatformSettingsAction } from "@/app/admin/(protected)/configuracion/actions";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";
import { InlineImageUpload } from "@/components/admin/inline-image-upload";
import { imageUrl } from "@/lib/image-url";
import type { AdminImage } from "@/lib/api/admin-types";

type FormState = {
  [K in keyof PlatformSettingsInput]: PlatformSettingsInput[K] extends boolean ? boolean : string;
};

function toFormState(settings: PlatformSettings): FormState {
  return {
    name: settings.name,
    shortName: settings.shortName ?? "",
    description: settings.description ?? "",
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
    contactEmail: settings.contactEmail ?? "",
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
    contactEmail: blankToNull(state.contactEmail),
    adsenseEnabled: state.adsenseEnabled,
    adsenseClientId: blankToNull(state.adsenseClientId),
    analyticsId: blankToNull(state.analyticsId),
    adsenseSlotArticle: blankToNull(state.adsenseSlotArticle),
    adsenseSlotListing: blankToNull(state.adsenseSlotListing),
  };
}

function TextField({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <FormField label={label} name={name}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={formInputClass} />
    </FormField>
  );
}

/**
 * Igual que TextField pero para imágenes de marca (logo/favicon/OG): antes
 * solo aceptaba pegar una URL a mano, lo que obligaba a subir la imagen a
 * otro lado primero para conseguir un link. Ahora se puede subir el
 * archivo acá mismo (mismo InlineImageUpload que Foto destacada/Fotografías
 * en los formularios de contenido) y la URL se completa sola.
 */
function ImageUrlField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  function handleUploaded(image: AdminImage) {
    onChange(imageUrl(image.url));
  }

  return (
    <FormField label={label} name={name}>
      <div className="flex flex-wrap items-center gap-2">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa de una URL arbitraria, no un asset local
          <img src={value} alt="" className="h-9 w-9 shrink-0 rounded border border-border object-contain" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL de la imagen"
          className={`${formInputClass} flex-1`}
        />
        <InlineImageUpload onUploaded={handleUploaded} compact />
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
        <TextField label="Nombre de la plataforma" name="name" value={state.name} onChange={(v) => set("name", v)} />
        <ImageUrlField label="Logo" name="logoUrl" value={state.logoUrl} onChange={(v) => set("logoUrl", v)} />
        <ImageUrlField label="Logo modo oscuro" name="logoDarkUrl" value={state.logoDarkUrl} onChange={(v) => set("logoDarkUrl", v)} />
        <ImageUrlField label="Favicon" name="faviconUrl" value={state.faviconUrl} onChange={(v) => set("faviconUrl", v)} />
        <ImageUrlField
          label="Imagen para compartir / Open Graph"
          name="ogImageUrl"
          value={state.ogImageUrl}
          onChange={(v) => set("ogImageUrl", v)}
        />
        <FormField label="Descripción" name="description">
          <textarea
            value={state.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className={formInputClass}
          />
        </FormField>
      </Section>

      <Section title="Apariencia">
        <FormField label="Tema" name="theme">
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
        <TextField label="Título por defecto" name="seoDefaultTitle" value={state.seoDefaultTitle} onChange={(v) => set("seoDefaultTitle", v)} />
        <TextField
          label="Imagen social por defecto (URL)"
          name="seoDefaultImageUrl"
          value={state.seoDefaultImageUrl}
          onChange={(v) => set("seoDefaultImageUrl", v)}
        />
        <FormField label="Meta descripción por defecto" name="seoDefaultDescription">
          <textarea
            value={state.seoDefaultDescription}
            onChange={(e) => set("seoDefaultDescription", e.target.value)}
            rows={2}
            className={formInputClass}
          />
        </FormField>
        <TextField
          label="Google Search Console (verificación)"
          name="googleSearchConsoleVerification"
          value={state.googleSearchConsoleVerification}
          onChange={(v) => set("googleSearchConsoleVerification", v)}
        />
      </Section>

      <Section title="Contacto">
        <TextField
          label="Correo de contacto"
          name="contactEmail"
          type="email"
          value={state.contactEmail}
          onChange={(v) => set("contactEmail", v)}
        />
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
          name="adsenseClientId"
          value={state.adsenseClientId}
          onChange={(v) => set("adsenseClientId", v)}
        />
        <TextField label="Analytics ID" name="analyticsId" value={state.analyticsId} onChange={(v) => set("analyticsId", v)} />
        <TextField
          label="Slot de anuncio — detalle de contenido"
          name="adsenseSlotArticle"
          value={state.adsenseSlotArticle}
          onChange={(v) => set("adsenseSlotArticle", v)}
        />
        <TextField
          label="Slot de anuncio — listados"
          name="adsenseSlotListing"
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
