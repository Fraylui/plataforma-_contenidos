"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CaretLeft, CaretRight, Heart, Pause, Play, ShareNetwork, X } from "@phosphor-icons/react";
import type { ActiveTopic } from "@/lib/api/types";
import type { HomeItem } from "@/lib/home-items";
import { formatPublicationDate } from "@/lib/content-labels";
import { storyLinkHref } from "@/lib/stories/link";
import { cn } from "@/lib/utils";
import { useContentReactions } from "@/components/content/like-share-bar";
import { CaughtUp } from "./caught-up";
import { markSeen } from "./seen-stories";
import { StoryFrame } from "./story-frame";
import { useStoryGestures } from "./story-gestures";
import { playableTopics, useStoryPlayer } from "./use-story-player";

/** Una historia cuenta como vista (y como visita) tras este tiempo en pantalla. */
const SEEN_AFTER_MS = 1_000;
/** Curvas de la spec (skill emil-design-eng): salida fuerte para entrar, más rápida al volver. */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

export type CloseReason = "user" | "history";

function sendSignal(url: string) {
  void fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
}

/**
 * Visor de historias a pantalla completa (spec 2026-10-23 §3.2). Toques a los
 * lados, mantener para pausar, deslizar para cambiar de tema, hacia abajo
 * para cerrar y hacia arriba para abrir el enlace; teclado completo y botón
 * de pausa siempre visible (WCAG 2.2.2). Al terminar, «Estás al día» con lo
 * más reciente. `imageSrc`: id de historia → foto ya resuelta en el servidor.
 */
export function StoryViewer({
  topics,
  startTopicId,
  onClose,
  recent,
  imageSrc,
  origin,
}: {
  topics: ActiveTopic[];
  startTopicId: string;
  onClose: (reason?: CloseReason) => void;
  recent: HomeItem[];
  imageSrc: Record<string, string>;
  origin?: { x: number; y: number };
}) {
  const router = useRouter();
  const [playable] = useState(() => playableTopics(topics, new Date()));
  const { state, current, progress, dispatch, setImageReady } = useStoryPlayer(playable, startTopicId);
  const topic = playable[state.topicIndex];
  const [shortPlaying, setShortPlaying] = useState(false);
  const [heart, setHeart] = useState(0);
  const stage = useRef<HTMLDivElement>(null);

  // Otra historia: el Short se cierra y el reloj sigue.
  const currentId = current?.id ?? null;
  const [lastId, setLastId] = useState(currentId);
  if (lastId !== currentId) {
    setLastId(currentId);
    if (shortPlaying) {
      setShortPlaying(false);
      dispatch({ type: "resume" });
    }
  }

  const reactions = useContentReactions({
    contentType: "stories",
    slug: current?.id ?? "",
    initialLikeCount: current?.likeCount ?? 0,
    title: current?.caption ?? topic?.category.name ?? "Historia",
    path: current ? `/historias/${current.id}` : undefined,
  });

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      markSeen(current.id, current.expiresAt);
      sendSignal(`/api/views?type=STORY&id=${encodeURIComponent(current.id)}`);
    }, SEEN_AFTER_MS);
    return () => clearTimeout(timer);
  }, [current]);

  // El botón Atrás (o el gesto de Android) cierra el visor: al abrirlo se agregó ?historia= al historial.
  useEffect(() => {
    const onPop = () => onClose("history");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onClose]);

  const openLink = useCallback(() => {
    if (!current?.link) return;
    sendSignal(`/api/stories/cta?id=${encodeURIComponent(current.id)}`);
    router.push(storyLinkHref(current.link));
  }, [current, router]);

  const togglePause = useCallback(() => dispatch({ type: state.paused ? "resume" : "pause" }), [dispatch, state.paused]);

  // Teclado: sin animaciones (se repite muchas veces).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") dispatch({ type: event.shiftKey ? "nextTopic" : "next" });
      else if (event.key === "ArrowLeft") dispatch({ type: event.shiftKey ? "prevTopic" : "prev" });
      else if (event.key === " ") {
        event.preventDefault();
        togglePause();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dispatch, togglePause]);

  const setStageTransform = (transform: string, transition = "none") => {
    if (!stage.current) return;
    stage.current.style.transition = transition;
    stage.current.style.transform = transform;
  };

  const gestures = useStoryGestures({
    onTapLeft: () => dispatch({ type: "prev" }),
    onTapRight: () => dispatch({ type: "next" }),
    onHoldStart: () => dispatch({ type: "pause" }),
    onHoldEnd: () => dispatch({ type: "resume" }),
    onNextTopic: () => {
      setStageTransform("");
      dispatch({ type: "nextTopic" });
    },
    onPrevTopic: () => {
      setStageTransform("");
      dispatch({ type: "prevTopic" });
    },
    onDismiss: () => onClose("user"),
    onSwipeUp: () => {
      setStageTransform("");
      openLink();
    },
    onDrag: (dx, dy) => {
      // Solo transform, directo en el elemento (sin re-render): abajo encoge, a los lados sigue al dedo con fricción.
      if (dy > Math.abs(dx)) setStageTransform(`translateY(${dy}px) scale(${Math.max(0.85, 1 - dy / 1000)})`);
      else if (Math.abs(dx) > Math.abs(dy)) setStageTransform(`translateX(${dx * 0.6}px)`);
    },
    onDragCancel: () => setStageTransform("", `transform 350ms ${EASE_OUT}`),
  });

  const total = topic?.stories.length ?? 0;
  const neighbours = useMemo(
    () => ({ prev: playable[state.topicIndex - 1], next: playable[state.topicIndex + 1] }),
    [playable, state.topicIndex],
  );
  const openStyle: CSSProperties = origin ? { transformOrigin: `${origin.x}px ${origin.y}px` } : {};

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose("user")}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" />
        <Dialog.Content
          aria-describedby={undefined}
          style={openStyle}
          className="fixed inset-0 z-[71] flex items-center justify-center outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.92] motion-safe:duration-[260ms] motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-in motion-reduce:fade-in motion-reduce:duration-150"
        >
          <Dialog.Title className="sr-only">{`Historias de ${topic?.category.name ?? ""}`}</Dialog.Title>

          {neighbours.prev && (
            <button
              type="button"
              onClick={() => dispatch({ type: "prevTopic" })}
              aria-label={`Tema anterior: ${neighbours.prev.category.name}`}
              className="mr-6 hidden h-[60dvh] w-[min(18vw,220px)] scale-[0.82] cursor-pointer rounded-card bg-white/10 opacity-50 transition-opacity hover:opacity-80 lg:block"
            >
              <span className="block p-4 text-left text-sm font-bold text-white">{neighbours.prev.category.name}</span>
            </button>
          )}

          <div className="relative h-dvh w-full overflow-hidden bg-black lg:h-[min(92dvh,860px)] lg:w-auto lg:aspect-[9/16] lg:rounded-card">
            {state.finished || !current ? (
              <CaughtUp recent={recent} />
            ) : (
              <>
                <div
                  ref={stage}
                  data-testid="story-stage"
                  {...gestures}
                  onDoubleClick={() => {
                    if (!reactions.liked) void reactions.toggleLike();
                    setHeart((n) => n + 1);
                  }}
                  className="absolute inset-0 touch-none overscroll-contain select-none"
                >
                  <StoryFrame
                    key={`${topic.category.id}-${current.id}`}
                    story={current}
                    src={current.imageId ? imageSrc[current.id] : null}
                    onReady={() => setImageReady(true)}
                    onCta={() => sendSignal(`/api/stories/cta?id=${encodeURIComponent(current.id)}`)}
                    shortPlaying={shortPlaying}
                    onPlayShort={() => {
                      setShortPlaying(true);
                      dispatch({ type: "pause" });
                    }}
                    priority
                  />
                  {heart > 0 && (
                    <Heart
                      key={heart}
                      weight="fill"
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 drop-shadow-lg motion-safe:animate-[heart-pop_800ms_ease-out]"
                    />
                  )}
                </div>

                {/* Barras y cabecera: fuera del área de gestos para que sus botones respondan al toque. */}
                <div className={cn("absolute inset-x-0 top-0 z-20 px-3 pt-3 transition-opacity duration-200", state.paused && !shortPlaying && "opacity-0 hover:opacity-100 focus-within:opacity-100")}>
                  <div className="flex gap-1" aria-hidden="true">
                    {topic.stories.map((s, index) => (
                      <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                        <span
                          className="block h-full origin-left bg-white"
                          style={{ transform: `scaleX(${index < state.storyIndex ? 1 : index === state.storyIndex ? progress : 0})` }}
                        />
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-white">
                    <Link
                      href={`/categorias/${topic.category.slug}`}
                      aria-label={`Ver todo de ${topic.category.name}`}
                      className="min-w-0 truncate text-sm font-bold drop-shadow"
                    >
                      {topic.category.name}
                    </Link>
                    <span className="shrink-0 text-xs text-white/80">{formatPublicationDate(current.publishedAt)}</span>
                    <p className="sr-only" aria-live="polite">{`Historia ${state.storyIndex + 1} de ${total}`}</p>
                    <span className="ml-auto flex shrink-0 items-center">
                      <ViewerButton label={state.paused ? "Reanudar" : "Pausar"} onClick={togglePause}>
                        {state.paused ? <Play weight="fill" className="size-5" /> : <Pause weight="fill" className="size-5" />}
                      </ViewerButton>
                      <ViewerButton label="Cerrar" onClick={() => onClose("user")}>
                        <X weight="bold" className="size-5" />
                      </ViewerButton>
                    </span>
                  </div>
                </div>

                <div className="absolute right-3 bottom-6 z-20 flex flex-col items-center gap-3 text-white">
                  <ViewerButton
                    label={reactions.liked ? "Quitar me gusta" : "Me gusta"}
                    pressed={reactions.liked}
                    onClick={() => void reactions.toggleLike()}
                  >
                    <Heart weight={reactions.liked ? "fill" : "regular"} className={cn("size-6", reactions.liked && "text-like")} />
                  </ViewerButton>
                  {reactions.likeCount > 0 && <span className="-mt-2 text-xs font-semibold tabular-nums">{reactions.likeCount}</span>}
                  <ViewerButton label="Compartir" onClick={() => void reactions.share()}>
                    <ShareNetwork weight="bold" className="size-6" />
                  </ViewerButton>
                  {reactions.copied && <span role="status" className="text-xs font-semibold">Enlace copiado</span>}
                </div>

                <div className="pointer-events-none absolute inset-y-0 -right-14 -left-14 z-10 hidden items-center justify-between lg:flex">
                  <ViewerButton label="Historia anterior" onClick={() => dispatch({ type: "prev" })} className="pointer-events-auto bg-white/90 text-zinc-900">
                    <CaretLeft weight="bold" className="size-5" />
                  </ViewerButton>
                  <ViewerButton label="Historia siguiente" onClick={() => dispatch({ type: "next" })} className="pointer-events-auto bg-white/90 text-zinc-900">
                    <CaretRight weight="bold" className="size-5" />
                  </ViewerButton>
                </div>
              </>
            )}
          </div>

          {neighbours.next && (
            <button
              type="button"
              onClick={() => dispatch({ type: "nextTopic" })}
              aria-label={`Tema siguiente: ${neighbours.next.category.name}`}
              className="ml-6 hidden h-[60dvh] w-[min(18vw,220px)] scale-[0.82] cursor-pointer rounded-card bg-white/10 opacity-50 transition-opacity hover:opacity-80 lg:block"
            >
              <span className="block p-4 text-left text-sm font-bold text-white">{neighbours.next.category.name}</span>
            </button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ViewerButton({
  label,
  onClick,
  pressed,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "flex size-11 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-[0.97] focus-visible:ring-[3px] focus-visible:ring-white/70 focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </button>
  );
}
