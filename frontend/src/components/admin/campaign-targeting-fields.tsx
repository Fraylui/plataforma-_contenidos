"use client";

import type { Category } from "@/lib/api/types";
import { AD_SECTIONS, type AdSection } from "@/lib/ads/ad-context";
import { cn } from "@/lib/utils";
import { Field, TextInput } from "@/components/ui";

export interface CampaignTargetingValue {
  sections: AdSection[];
  categoryIds: string[];
  countries: string;
  regions: string;
}

export function splitList(value: string): string[] {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-border bg-background text-muted hover:border-accent/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/**
 * Segmentación de la campaña (ver CampaignTargeting.java): dónde y para
 * quién sale. Nada elegido en una fila = sin restricción. Debajo, un resumen
 * en lenguaje llano de lo que se eligió.
 */
export function CampaignTargetingFields({
  value,
  onChange,
  categories,
}: {
  value: CampaignTargetingValue;
  onChange: (value: CampaignTargetingValue) => void;
  categories: Category[];
}) {
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const label = (c: Category) => (c.parentId && nameById.get(c.parentId) ? `${nameById.get(c.parentId)} › ${c.name}` : c.name);
  const sorted = [...categories].sort((a, b) => label(a).localeCompare(label(b), "es"));

  const parts = [
    value.sections.length ? AD_SECTIONS.filter((s) => value.sections.includes(s.value)).map((s) => s.label).join(", ") : "todas las secciones",
    value.categoryIds.length
      ? `temas: ${value.categoryIds.map((id) => nameById.get(id) ?? "—").join(", ")} (con sus subtemas)`
      : "todos los temas",
    splitList(value.countries).length || splitList(value.regions).length
      ? `visitantes de ${[...splitList(value.countries).map((c) => c.toUpperCase()), ...splitList(value.regions)].join(", ")}`
      : "visitantes de cualquier lugar",
  ];

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-background p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Segmentación</p>
        <p className="mt-0.5 text-xs text-muted">
          Lo que no elijas no restringe. En una página donde calza, una campaña segmentada va antes que una general.
        </p>
      </div>

      <Field label="Secciones del sitio" name="targetSections">
        <div className="flex flex-wrap gap-2">
          {AD_SECTIONS.map((section) => (
            <Chip
              key={section.value}
              active={value.sections.includes(section.value)}
              onClick={() => onChange({ ...value, sections: toggle(value.sections, section.value) })}
            >
              {section.label}
            </Chip>
          ))}
        </div>
      </Field>

      {sorted.length > 0 && (
        <Field label="Temas (cada uno incluye sus subtemas)" name="targetCategoryIds">
          <div className="flex flex-wrap gap-2">
            {sorted.map((category) => (
              <Chip
                key={category.id}
                active={value.categoryIds.includes(category.id)}
                onClick={() => onChange({ ...value, categoryIds: toggle(value.categoryIds, category.id) })}
              >
                {label(category)}
              </Chip>
            ))}
          </div>
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="País del visitante (código de 2 letras, separados por coma)" name="targetCountries">
          <TextInput
            type="text"
            value={value.countries}
            onChange={(e) => onChange({ ...value, countries: e.target.value })}
            placeholder="PE, CO"
            className="uppercase"
          />
        </Field>
        <Field label="Región del visitante (separadas por coma)" name="targetRegions">
          <TextInput
            type="text"
            value={value.regions}
            onChange={(e) => onChange({ ...value, regions: e.target.value })}
            placeholder="Ayacucho, Lima"
          />
        </Field>
      </div>
      <p className="text-xs text-muted">
        La ubicación del visitante la informa Cloudflare según su conexión. Requiere activar «Add visitor location
        headers» en Cloudflare; sin eso, las campañas con país o región no se muestran.
      </p>

      <p role="status" className="rounded-md bg-canvas px-3 py-2 text-xs text-foreground">
        <span className="font-semibold">Se mostrará en:</span> {parts.join(" · ")}.
      </p>
    </div>
  );
}
