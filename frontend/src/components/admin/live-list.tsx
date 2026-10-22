"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowSquareOut, Broadcast, PencilSimple, Stop, X } from "@phosphor-icons/react";
import type { LiveStatus, LiveStream } from "@/lib/api/types";
import type { LiveStep } from "@/lib/api/admin/live";
import { formatEventDateTime } from "@/lib/content-labels";
import { liveStepAction } from "@/app/admin/(protected)/en-vivo/actions";
import { Badge, Button, type BadgeTone } from "@/components/ui";

const STATUS: Record<LiveStatus, { label: string; tone: BadgeTone }> = {
  SCHEDULED: { label: "Programada", tone: "warning" },
  LIVE: { label: "En vivo", tone: "danger" },
  ENDED: { label: "Terminada", tone: "neutral" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
};

const DONE: Record<LiveStep, string> = {
  start: "¡Estás en vivo! El inicio ya lo anuncia.",
  end: "Transmisión terminada.",
  cancel: "Transmisión cancelada.",
};

/** Transmisiones del panel con su acción principal según el estado: Estamos en vivo / Terminar. */
export function LiveList({ streams }: { streams: LiveStream[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(stream: LiveStream, step: LiveStep) {
    setBusy(`${stream.id}-${step}`);
    const result = await liveStepAction(stream.id, step);
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(DONE[step]);
    router.refresh();
  }

  return (
    <ul className="space-y-3">
      {streams.map((stream) => {
        const status = STATUS[stream.status];
        return (
          <li key={stream.id} className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida por YouTube (i.ytimg.com) */}
            <img
              src={`https://i.ytimg.com/vi/${stream.youtubeVideoId}/mqdefault.jpg`}
              alt=""
              loading="lazy"
              className="aspect-video w-full shrink-0 rounded-lg bg-canvas-strong object-cover sm:w-36"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={status.tone} dot>
                  {status.label}
                </Badge>
                {stream.status === "SCHEDULED" && (
                  <span className="text-xs text-muted">
                    {stream.scheduledStart ? formatEventDateTime(stream.scheduledStart) : "Sin hora"}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate font-semibold text-foreground">{stream.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stream.status === "SCHEDULED" && (
                <>
                  <Button
                    icon={<Broadcast weight="fill" aria-hidden="true" />}
                    loading={busy === `${stream.id}-start`}
                    disabled={busy !== null}
                    onClick={() => run(stream, "start")}
                  >
                    Estamos en vivo
                  </Button>
                  <Link
                    href={`/admin/en-vivo/${stream.id}`}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted hover:bg-field hover:text-foreground"
                  >
                    <PencilSimple className="size-4" aria-hidden="true" />
                    Editar
                  </Link>
                  <Button variant="ghost" icon={<X aria-hidden="true" />} disabled={busy !== null} onClick={() => run(stream, "cancel")}>
                    Cancelar
                  </Button>
                </>
              )}
              {stream.status === "LIVE" && (
                <Button
                  variant="danger"
                  icon={<Stop weight="fill" aria-hidden="true" />}
                  loading={busy === `${stream.id}-end`}
                  disabled={busy !== null}
                  onClick={() => run(stream, "end")}
                >
                  Terminar
                </Button>
              )}
              {stream.status !== "CANCELLED" && (
                <a
                  href={`/en-vivo/${stream.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted hover:bg-field hover:text-foreground"
                >
                  <ArrowSquareOut className="size-4" aria-hidden="true" />
                  Ver en el sitio
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
