"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlatformSettings } from "@/lib/api/types";
import type { PlatformSettingsInput } from "@/lib/api/admin-types";
import { updatePlatformSettingsAction } from "@/app/admin/(protected)/configuracion/actions";
import { AdminButton, Combobox, FormError, FormField, formInputClass } from "@/components/admin/ui";
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
          id={name}
          name={name}
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

/**
 * Vista previa de cómo se ve el sitio al compartirlo (Twitter/Facebook-style
 * card) — usa los mismos campos que ya se cargan acá (título/descripción/
 * imagen SEO, o el nombre/descripción de la plataforma si no hay SEO
 * propio, mismo fallback que usa el backend al armar el <head> real). Nada
 * de un campo nuevo: es una vista de los que ya existen, para no tener que
 * publicar algo y compartirlo para recién ver cómo queda.
 */
function SharePreview({ title, description, imageUrl, siteName }: { title: string; description: string; imageUrl: string; siteName: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background">
      <div className="aspect-[1.91/1] w-full overflow-hidden bg-canvas-strong">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa de una URL arbitraria
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">Sin imagen social</div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="text-[11px] tracking-wide text-muted uppercase">{siteName || "tusitio.com"}</p>
        <p className="line-clamp-1 text-sm font-semibold text-foreground">{title || "Título por defecto"}</p>
        <p className="line-clamp-2 text-xs text-muted">{description || "Meta descripción por defecto."}</p>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "identidad", label: "Identidad" },
  { id: "apariencia", label: "Apariencia" },
  { id: "seo", label: "SEO por defecto" },
  { id: "contacto", label: "Contacto" },
  { id: "monetizacion", label: "Monetización" },
] as const;

/** Misma tarjeta que el resto del panel (article-form.tsx, place-form.tsx, ...): border-border/60 bg-surface, sin shadow. */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 rounded-xl border border-border/60 bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
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
    <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-[180px_1fr] lg:items-start lg:gap-8">
      {/* Nav de secciones — ancla en vez de tabs: todos los campos se quedan en el
          DOM (autocompletado del navegador, validación nativa del form entero al
          enviar) en lugar de perderse al cambiar de pestaña. */}
      <nav aria-label="Secciones de configuración" className="hidden lg:sticky lg:top-24 lg:block">
        <ul className="space-y-0.5 border-l border-border">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="-ml-px block border-l-2 border-transparent px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/50 hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 max-w-3xl space-y-6 lg:mt-0">
        <Section id="identidad" title="Identidad">
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

        <Section id="apariencia" title="Apariencia">
          <FormField label="Tema" name="theme">
            <Combobox
              options={[
                { id: "AUTO", label: "Auto (según el sistema)" },
                { id: "LIGHT", label: "Claro" },
                { id: "DARK", label: "Oscuro" },
              ]}
              value={state.theme}
              onSelect={(id) => id && set("theme", id as FormState["theme"])}
            />
          </FormField>
        </Section>

        <Section id="seo" title="SEO por defecto">
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
          <div className="sm:col-span-2">
            <span className="block text-sm font-medium text-foreground">Así se ve al compartirlo</span>
            <SharePreview
              title={state.seoDefaultTitle || state.name}
              description={state.seoDefaultDescription || state.description}
              imageUrl={state.seoDefaultImageUrl || state.ogImageUrl}
              siteName={state.name}
            />
          </div>
        </Section>

        <Section id="contacto" title="Contacto">
          <TextField
            label="Correo de contacto"
            name="contactEmail"
            type="email"
            value={state.contactEmail}
            onChange={(v) => set("contactEmail", v)}
          />
        </Section>

        <Section id="monetizacion" title="Monetización">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              name="adsenseEnabled"
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
          <p className="text-xs text-muted">
            Las posiciones/slots de anuncio se gestionan en{" "}
            <Link href="/admin/publicidad" className="underline underline-offset-2 hover:text-accent">
              Publicidad
            </Link>
            .
          </p>
        </Section>

        {error && <FormError message={error} />}
        {savedAt && !error && (
          <p role="status" className="text-sm text-accent">
            Guardado.
          </p>
        )}

        <AdminButton type="submit" disabled={pending || !state.name.trim()}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </AdminButton>
      </div>
    </form>
  );
}
