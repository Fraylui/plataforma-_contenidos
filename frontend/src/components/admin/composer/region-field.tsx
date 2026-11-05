"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Field, Select } from "@/components/ui";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { PERU_REGIONS } from "@/lib/peru-regions";

/** El Perú primero (la mayoría del contenido es de aquí), luego el resto por nombre. */
const COUNTRIES = [...COUNTRY_OPTIONS.filter((c) => c.id === "PE"), ...COUNTRY_OPTIONS.filter((c) => c.id !== "PE")];

/**
 * País y, si es el Perú, región. Con ellos, quien toque «Ya fui» gana un
 * sello en «Mis viajes»: el de la región dentro del Perú, el del país fuera.
 */
export function RegionField({ readOnly }: { readOnly: boolean }) {
  const { register } = useFormContext<{ country: string; region: string }>();
  const country = useWatch<{ country: string }>({ name: "country" }) as string;
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="País" name="country" hint="Quien diga «Ya fui» gana el sello de este país en «Mis viajes».">
        <Select disabled={readOnly} {...register("country")}>
          <option value="">Sin país</option>
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      {country === "PE" && (
        <Field label="Región" name="region" hint="En el Perú, el sello es de la región.">
          <Select disabled={readOnly} {...register("region")}>
            <option value="">Sin región</option>
            {PERU_REGIONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  );
}
