"use client";

import { useRef, useState } from "react";
import { CaretRight, DotsThree, EyeSlash, Info, Play } from "@phosphor-icons/react";
import type { ResolvedCampaign } from "@/lib/api/types";
import { imageUrl } from "@/lib/image-url";
import { callToActionLabel, NATIVE_ASPECT_RATIO } from "@/lib/ads/call-to-action";
import { hideAd, unhideAd } from "@/lib/ads/hidden-ads";
import { useViewableImpression } from "@/components/legal/use-viewable-impression";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/admin/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/admin/ui/dialog";

/** Hasta aquí el texto se ve entero; más largo, se corta y aparece «más» (como Instagram). */
const TEXT_PREVIEW_CHARS = 125;

/**
 * Anuncio nativo del feed (spec 2026-10-16), con la anatomía de un anuncio
 * de Instagram/Facebook y la misma superficie que PostCard, para que se lea
 * como un post y no como un aviso pegado:
 *
 *  1. Encabezado: logo y nombre del anunciante, «Patrocinado» (la divulgación
 *     que piden Google, la IAB e Indecopi) y el menú «⋯» con «Ocultar este
 *     anuncio» y «¿Por qué veo este anuncio?».
 *  2. Medio a todo el ancho, sin márgenes: foto (lleva al destino) o video de
 *     YouTube que carga recién al tocar (dominio -nocookie) y cuenta la
 *     reproducción. Alto reservado por su proporción: sin saltos.
 *  3. Barra de acción: dominio y titular a la izquierda, botón a la derecha.
 *  4. Pie: nombre en negrita y el texto, con «más» si es largo.
 *
 * Sin me gusta ni compartir: los «me gusta» del sitio son del contenido
 * propio. Todo clic pasa por /ads/campaigns/{id}/click (contado; el link real
 * nunca está en el HTML).
 */
export function NativeAdPost({ campaign, preview = false }: {
  campaign: ResolvedCampaign;
  /** Vista previa del panel: no cuenta impresiones ni reproducciones, los enlaces no navegan y no hay menú. */
  preview?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useViewableImpression(ref, campaign.id);
  const linkProps = preview
    ? { href: "#", onClick: (e: React.MouseEvent) => e.preventDefault(), "aria-disabled": true }
    : { href: imageUrl(`/api/v1/ads/campaigns/${campaign.id}/click`), target: "_blank", rel: "noopener noreferrer sponsored" };
  const [hidden, setHidden] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const name = campaign.advertiserName ?? "Anunciante";
  const cta = callToActionLabel(campaign.callToAction ?? "LEARN_MORE");
  const aspectRatio = NATIVE_ASPECT_RATIO[campaign.mediaAspect ?? "1:1"] ?? "1 / 1";

  if (hidden) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-surface px-4 py-3 text-sm sm:rounded-2xl sm:border">
        <p className="text-muted">Ocultaste este anuncio.</p>
        <button
          type="button"
          onClick={() => {
            unhideAd(campaign.id);
            setHidden(false);
          }}
          className="cursor-pointer rounded-full px-3 py-1.5 font-semibold text-foreground transition-colors hover:bg-canvas"
        >
          Deshacer
        </button>
      </div>
    );
  }

  return (
    <article
      ref={preview ? undefined : ref}
      aria-label={`Patrocinado: ${name}`}
      className="no-auto-ads overflow-hidden border-b border-border/70 bg-surface sm:rounded-2xl sm:border sm:shadow-[0_1px_2px_rgb(0_0_0_/_0.04)]"
    >
      <header className="flex items-center gap-3 py-3 pr-2 pl-4">
        <AdvertiserAvatar name={name} logoSrc={campaign.advertiserLogoSrc} plain={preview} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-bold text-foreground">{name}</p>
          <p className="text-xs text-muted">Patrocinado</p>
        </div>
        {!preview && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Opciones del anuncio"
            className="flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors outline-none hover:bg-canvas focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <DotsThree className="size-6" weight="bold" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => {
                hideAd(campaign.id);
                setHidden(true);
              }}
            >
              <EyeSlash aria-hidden="true" />
              Ocultar este anuncio
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setWhyOpen(true)}>
              <Info aria-hidden="true" />
              ¿Por qué veo este anuncio?
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        )}
      </header>

      <div className="relative w-full overflow-hidden bg-canvas" style={{ aspectRatio }}>
        {campaign.youtubeVideoId ? (
          <AdVideo campaignId={campaign.id} videoId={campaign.youtubeVideoId} title={campaign.headline ?? name} count={!preview} />
        ) : (
          <a {...linkProps} className="absolute inset-0 block">
            {campaign.imageSrc && preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa del panel (host propio, sin optimizar)
              <img src={campaign.imageSrc} alt={campaign.imageAlt ?? name} className="absolute inset-0 h-full w-full object-cover" />
            ) : campaign.imageSrc ? (
              <SkeletonImage src={campaign.imageSrc} alt={campaign.imageAlt ?? name} className="object-cover" sizes="(min-width: 640px) 600px, 100vw" />
            ) : null}
          </a>
        )}
      </div>

      <a
        {...linkProps}
        className="flex items-center gap-3 border-b border-border/70 px-4 py-2.5 transition-colors hover:bg-canvas"
      >
        <span className="min-w-0 flex-1 leading-tight">
          {campaign.displayDomain && <span className="block truncate text-xs text-muted uppercase">{campaign.displayDomain}</span>}
          {campaign.headline && <span className="block truncate text-sm font-semibold text-foreground">{campaign.headline}</span>}
        </span>
        <span className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-accent-fill px-4 text-[13px] font-bold text-accent-foreground">
          {cta}
          <CaretRight className="size-3.5" weight="bold" aria-hidden="true" />
        </span>
      </a>

      <AdText name={name} text={campaign.primaryText ?? ""} />

      <Dialog open={whyOpen} onOpenChange={setWhyOpen}>
        <DialogContent>
          <DialogTitle>¿Por qué veo este anuncio?</DialogTitle>
          <DialogDescription>
            {name} pagó para aparecer en esta parte del sitio. Sale por lo que estás viendo ahora: la sección, el
            tema y la zona desde donde visitas. No usamos tu historial ni datos personales. Si no te interesa,
            puedes ocultarlo desde el menú «⋯».
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function AdvertiserAvatar({ name, logoSrc, plain }: { name: string; logoSrc: string | null; plain: boolean }) {
  if (logoSrc) {
    return (
      <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-canvas ring-1 ring-border">
        {plain ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa del panel
          <img src={logoSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <SkeletonImage src={logoSrc} alt="" className="object-cover" sizes="36px" />
        )}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-canvas-strong text-sm font-black text-foreground">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Miniatura de YouTube con play; el iframe (y sus scripts) solo se cargan al tocar. */
function AdVideo({ campaignId, videoId, title, count }: { campaignId: string; videoId: string; title: string; count: boolean }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full bg-black"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setPlaying(true);
        if (count) void fetch(`/api/ads/play?id=${campaignId}`, { method: "POST", keepalive: true }).catch(() => undefined);
      }}
      aria-label={`Reproducir video: ${title}`}
      className="group absolute inset-0 flex cursor-pointer items-center justify-center bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida por YouTube, no pasa por next/image */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="relative flex size-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform group-hover:scale-105">
        <Play className="ml-0.5 size-7" weight="fill" aria-hidden="true" />
      </span>
    </button>
  );
}

function AdText({ name, text }: { name: string; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > TEXT_PREVIEW_CHARS;
  const shown = long && !expanded ? `${text.slice(0, TEXT_PREVIEW_CHARS).trimEnd()}…` : text;
  return (
    <p className="px-4 pt-2.5 pb-4 text-sm leading-snug whitespace-pre-line text-foreground">
      <span className="font-bold">{name}</span> {shown}
      {long && !expanded && (
        <>
          {" "}
          <button type="button" onClick={() => setExpanded(true)} className="cursor-pointer font-medium text-muted hover:text-foreground">
            más
          </button>
        </>
      )}
    </p>
  );
}
