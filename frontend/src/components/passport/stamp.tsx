import { SealCheck } from "@phosphor-icons/react/dist/ssr";
import { PERU_REGIONS } from "@/lib/peru-regions";
import { cn } from "@/lib/utils";

/**
 * Un tono propio por sello, para que la colección se vea variada: las
 * regiones del Perú repartidas en el círculo de color; los países, por su código.
 */
export function regionHue(key: string): number {
  const index = PERU_REGIONS.findIndex((r) => r.key === key);
  if (index >= 0) return Math.round((index * 360) / PERU_REGIONS.length);
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
}

/**
 * Sello de una región o de un país. Con sello: tinta de color, borde doble y un poco
 * torcido, como el de un pasaporte de verdad. Sin sello: solo el contorno
 * punteado esperando.
 */
export function Stamp({
  region,
  name,
  stamped,
  year,
  slam = false,
  className,
}: {
  region: string;
  name: string;
  stamped: boolean;
  year?: string;
  slam?: boolean;
  className?: string;
}) {
  const hue = regionHue(region);
  if (!stamped) {
    return (
      <div
        className={cn(
          "flex aspect-square flex-col items-center justify-center rounded-full border-2 border-dashed border-border p-1 text-center text-[10px] leading-tight font-semibold text-muted",
          className,
        )}
      >
        {name}
      </div>
    );
  }
  return (
    <div
      style={{ color: `hsl(${hue} 70% 38%)`, borderColor: `hsl(${hue} 70% 42%)`, backgroundColor: `hsl(${hue} 80% 50% / 0.1)` }}
      className={cn(
        "relative flex aspect-square rotate-[-9deg] flex-col items-center justify-center rounded-full border-[3px] p-1 text-center dark:brightness-150",
        slam && "motion-safe:animate-[stamp-slam_520ms_cubic-bezier(.2,.9,.3,1.2)_both]",
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-[3px] rounded-full border border-current opacity-60" />
      <SealCheck weight="fill" aria-hidden="true" className="size-4" />
      <span className="mt-0.5 text-[10px] leading-tight font-black tracking-tight uppercase">{name}</span>
      {year && <span className="text-[9px] font-bold tabular-nums opacity-80">{year}</span>}
      {slam && (
        <span
          aria-hidden="true"
          style={{ borderColor: `hsl(${hue} 70% 45%)` }}
          className="pointer-events-none absolute inset-0 rounded-full border-4 opacity-0 motion-safe:animate-[ink-ring_700ms_ease-out_200ms]"
        />
      )}
    </div>
  );
}
