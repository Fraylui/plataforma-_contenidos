import { Warning } from "@phosphor-icons/react/dist/ssr";
import type { AdvertiserIndustry } from "@/lib/api/admin-types";
import { industryWarning } from "@/lib/ads/industry";

/** Advertencia obligatoria del rubro del anunciante (nada si el rubro no tiene). */
export function IndustryWarningNotice({ industry }: { industry: AdvertiserIndustry }) {
  const warning = industryWarning(industry);
  if (!warning) return null;
  return (
    <div role="note" className="flex gap-2.5 rounded-xl bg-warning-soft p-3 text-sm text-foreground">
      <Warning aria-hidden="true" weight="fill" className="mt-0.5 size-4 shrink-0 text-warning" />
      <p>
        <span className="font-semibold">Advertencia obligatoria ({warning.law}).</span> {warning.text}
      </p>
    </div>
  );
}
