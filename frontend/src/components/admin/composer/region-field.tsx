"use client";

import { useFormContext } from "react-hook-form";
import { Field, Select } from "@/components/ui";
import { PERU_REGIONS } from "@/lib/peru-regions";

/** Región del lugar: con ella, quien diga «Ya fui» gana el sello de esa región en su Pasaporte. */
export function RegionField({ readOnly }: { readOnly: boolean }) {
  const { register } = useFormContext<{ region: string }>();
  return (
    <Field
      label="Región"
      name="region"
      hint="Con la región, quien visite el lugar gana su sello en el Pasaporte."
      className="mt-4"
    >
      <Select disabled={readOnly} {...register("region")}>
        <option value="">Sin región</option>
        {PERU_REGIONS.map((r) => (
          <option key={r.key} value={r.key}>
            {r.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}
