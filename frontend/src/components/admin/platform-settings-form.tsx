"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChartLineUp,
  CurrencyCircleDollar,
  Envelope,
  FacebookLogo,
  GearSix,
  InstagramLogo,
  PaintBrush,
  ShareNetwork,
  TiktokLogo,
  WhatsappLogo,
  XLogo,
  YoutubeLogo,
  type Icon,
} from "@phosphor-icons/react";
import type { PlatformSettings } from "@/lib/api/types";
import type { AdminImage, PlatformSettingsInput } from "@/lib/api/admin-types";
import { updatePlatformSettingsAction } from "@/app/admin/(protected)/configuracion/actions";
import { FormError } from "@/components/admin/ui";
import { Button, Card, Checkbox, Combobox, Field, TextArea, TextInput } from "@/components/ui";
import { InlineImageUpload } from "@/components/admin/inline-image-upload";
import { SharePreview } from "@/components/admin/share-preview";
import { imageUrl } from "@/lib/image-url";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { SOCIAL_NETWORKS, socialLinkError, type SocialKey } from "@/lib/social-links";

type FormState = {
  [K in keyof PlatformSettingsInput]: PlatformSettingsInput[K] extends boolean ? boolean : string;
};

function toFormState(settings: PlatformSettings): FormState {
  const state = {} as FormState;
  for (const [key, value] of Object.entries(settings) as [keyof FormState, unknown][]) {
    (state as Record<string, unknown>)[key] = typeof value === "boolean" ? value : ((value as string | null) ?? "");
  }
  return state;
}

function toInput(state: FormState): PlatformSettingsInput {
  const input = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(state)) {
    input[key] = typeof value === "boolean" ? value : value.trim() === "" ? null : value.trim();
  }
  // Nombre y país siempre llevan valor.
  return { ...(input as unknown as PlatformSettingsInput), name: state.name.trim(), homeCountry: state.homeCountry };
}

const SOCIAL_ICONS: Record<SocialKey, Icon> = {
  youtube: YoutubeLogo,
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
  facebook: FacebookLogo,
  x: XLogo,
  whatsapp: WhatsappLogo,
};

const SECTIONS: { id: string; title: string; icon: Icon }[] = [
  { id: "marca", title: "Marca", icon: PaintBrush },
  { id: "compartir", title: "Al compartir y en Google", icon: ShareNetwork },
  { id: "redes", title: "Nuestras redes", icon: InstagramLogo },
  { id: "contacto", title: "Contacto", icon: Envelope },
  { id: "ingresos", title: "Ingresos", icon: CurrencyCircleDollar },
  { id: "medicion", title: "Medición", icon: ChartLineUp },
  { id: "avanzado", title: "Avanzado", icon: GearSix },
];

function Section({ id, description, children }: { id: string; description?: string; children: ReactNode }) {
  const section = SECTIONS.find((s) => s.id === id)!;
  return (
    <div id={id} className="scroll-mt-24">
      <Card title={section.title} description={description}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      </Card>
    </div>
  );
}

/** Imagen de marca: se sube aquí mismo o se pega un enlace; se ve al lado. */
function ImageField({
  label,
  name,
  hint,
  value,
  onChange,
}: {
  label: string;
  name: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} name={name} hint={hint}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-control bg-canvas-strong">
          {value && (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa de una URL arbitraria
            <img src={value} alt="" className="size-full object-contain" />
          )}
        </span>
        <TextInput
          id={name}
          name={name}
          type="url"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… o súbela"
          className="min-w-0 flex-1"
        />
        <InlineImageUpload onUploaded={(image: AdminImage) => onChange(imageUrl(image.url))} compact />
      </div>
    </Field>
  );
}

/**
 * Configuración del sitio (rehecha 2026-10-21): secciones en lenguaje de
 * plataforma, sin campos duplicados ni muertos, redes oficiales con su
 * ícono y una barra de guardado que aparece solo cuando hay cambios.
 */
export function PlatformSettingsForm({ settings }: { settings: PlatformSettings }) {
  const [saved, setSaved] = useState<FormState>(() => toFormState(settings));
  const [state, setState] = useState<FormState>(saved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(saved), [state, saved]);
  const socialErrors = useMemo(
    () => Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n.key, socialLinkError(n.key, state[n.field])])) as Record<SocialKey, string | null>,
    [state],
  );
  const hasErrors = Object.values(socialErrors).some(Boolean) || !state.name.trim();

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setJustSaved(false);
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    if (hasErrors) return;
    setPending(true);
    setError(null);
    const result = await updatePlatformSettingsAction(toInput(state));
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(state);
    setShowErrors(false);
    setJustSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-24 lg:grid lg:grid-cols-[200px_1fr] lg:items-start lg:gap-8">
      {/* Índice con anclas (no pestañas): todo el formulario queda en el DOM y se guarda junto. */}
      <nav aria-label="Secciones de configuración" className="hidden lg:sticky lg:top-24 lg:block">
        <ul className="space-y-1">
          {SECTIONS.map(({ id, title, icon: SectionIcon }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-field hover:text-foreground"
              >
                <SectionIcon className="size-4 shrink-0" aria-hidden="true" />
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 max-w-3xl space-y-6 lg:mt-0">
        <Section id="marca" description="Cómo se reconoce la plataforma en el menú, la pestaña del navegador y las tarjetas.">
          <Field label="Nombre de la plataforma" name="name" error={showErrors && !state.name.trim() ? "Escribe el nombre." : undefined}>
            <TextInput autoComplete="off" value={state.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <ImageField label="Logo" name="logoUrl" value={state.logoUrl} onChange={(v) => set("logoUrl", v)} />
          <ImageField
            label="Logo para modo oscuro (opcional)"
            name="logoDarkUrl"
            hint="Si tu logo es oscuro, una versión clara para quien usa el celular en modo oscuro."
            value={state.logoDarkUrl}
            onChange={(v) => set("logoDarkUrl", v)}
          />
          <ImageField
            label="Ícono de la pestaña"
            name="faviconUrl"
            hint="Cuadrado, se ve pequeñito junto al título de la pestaña."
            value={state.faviconUrl}
            onChange={(v) => set("faviconUrl", v)}
          />
        </Section>

        <Section id="compartir" description="Lo que muestran Google, WhatsApp y las redes cuando alguien comparte el sitio.">
          <div className="sm:col-span-2">
            <Field label="Descripción" name="description" hint="Una o dos frases sobre qué encuentra la gente aquí.">
              <TextArea value={state.description} maxLength={160} rows={2} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
          <ImageField
            label="Imagen al compartir"
            name="ogImageUrl"
            hint="Horizontal (1200 × 630). También se usa cuando un contenido no tiene foto."
            value={state.ogImageUrl}
            onChange={(v) => set("ogImageUrl", v)}
          />
          <Field label="Título en Google (opcional)" name="seoDefaultTitle" hint="Si lo dejas vacío, se usa el nombre.">
            <TextInput autoComplete="off" placeholder={state.name} value={state.seoDefaultTitle} onChange={(e) => set("seoDefaultTitle", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <SharePreview
              siteName={state.name}
              path=""
              title={state.seoDefaultTitle || state.name}
              description={state.description}
              imageUrl={state.ogImageUrl || null}
              emptyImageHint="Sube la imagen al compartir (1200 × 630) y se verá aquí"
            />
          </div>
        </Section>

        <Section id="redes" description="Se muestran con su ícono en «Síguenos». Solo enlaces: pega la dirección de cada perfil.">
          {SOCIAL_NETWORKS.map((network) => {
            const NetworkIcon = SOCIAL_ICONS[network.key];
            return (
              <Field
                key={network.key}
                label={network.label}
                name={network.field}
                error={showErrors ? socialErrors[network.key] : undefined}
              >
                <TextInput
                  type="url"
                  autoComplete="off"
                  placeholder={network.example}
                  leading={<NetworkIcon weight="fill" />}
                  value={state[network.field]}
                  onChange={(e) => set(network.field, e.target.value)}
                />
              </Field>
            );
          })}
          <p className="text-xs text-muted sm:col-span-2">
            Canal de WhatsApp: en WhatsApp, Novedades → tu canal → Compartir enlace. Con el enlace puesto, cada publicación termina con
            «Síguenos en WhatsApp».
          </p>
        </Section>

        <Section id="contacto">
          <Field label="Correo de contacto" name="contactEmail" hint="Aparece en la página de Contacto.">
            <TextInput type="email" autoComplete="off" value={state.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
          <Field
            label="País del sitio"
            name="homeCountry"
            hint="Quien entra sin ubicación conocida ve en «Hoy se celebra» lo mundial y lo de este país."
          >
            <Combobox options={COUNTRY_OPTIONS} value={state.homeCountry} onSelect={(id) => id && set("homeCountry", id)} placeholder="Buscar un país" />
          </Field>
        </Section>

        <Section id="ingresos" description="Los anuncios de Google en el sitio. Los espacios y los anunciantes directos están en Publicidad.">
          <div className="sm:col-span-2">
            <Checkbox
              name="adsenseEnabled"
              label="Mostrar anuncios de Google AdSense"
              description="Necesita tu código de editor y que Google haya aprobado el sitio."
              checked={state.adsenseEnabled}
              onChange={(e) => set("adsenseEnabled", e.target.checked)}
            />
          </div>
          <Field label="Código de editor de AdSense" name="adsenseClientId" hint="Empieza con ca-pub-.">
            <TextInput autoComplete="off" placeholder="ca-pub-…" value={state.adsenseClientId} onChange={(e) => set("adsenseClientId", e.target.value)} />
          </Field>
          <p className="self-end text-xs text-muted">
            <Link href="/admin/espacios" className="font-medium text-accent underline-offset-2 hover:underline">
              Espacios publicitarios
            </Link>
          </p>
        </Section>

        <Section id="medicion" description="Visitas en Google Analytics. Solo se activa para quien acepta las cookies (Ley 29733).">
          <Field label="ID de medición de Google Analytics" name="analyticsId" hint="Empieza con G-. Vacío = sin Analytics.">
            <TextInput autoComplete="off" placeholder="G-…" value={state.analyticsId} onChange={(e) => set("analyticsId", e.target.value)} />
          </Field>
        </Section>

        <Section id="avanzado">
          <Field
            label="Verificación de Google Search Console"
            name="googleSearchConsoleVerification"
            hint="El código que te da Search Console para confirmar que el sitio es tuyo."
          >
            <TextInput
              autoComplete="off"
              value={state.googleSearchConsoleVerification}
              onChange={(e) => set("googleSearchConsoleVerification", e.target.value)}
            />
          </Field>
        </Section>

        {error && <FormError message={error} />}
        {justSaved && !dirty && (
          <p role="status" className="text-sm font-medium text-success">
            Cambios guardados. Ya se ven en el sitio.
          </p>
        )}
      </div>

      {/* Barra fija: solo con cambios, como en las apps (sin buscar el botón al final de la página). */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-[calc(var(--bottom-bar-h,0px)+0.75rem)] z-40 flex justify-center px-4 lg:bottom-6">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-overlay">
            <p className="min-w-0 flex-1 text-sm font-medium text-foreground">Tienes cambios sin guardar</p>
            <Button variant="ghost" onClick={() => setState(saved)} disabled={pending}>
              Descartar
            </Button>
            <Button type="submit" loading={pending}>
              Guardar cambios
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
