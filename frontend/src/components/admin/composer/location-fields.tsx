"use client";

import dynamic from "next/dynamic";
import { useFormContext, useWatch } from "react-hook-form";
import { Field, TextInput } from "@/components/ui";

const LocationPicker = dynamic(() => import("../location-picker").then((m) => m.LocationPicker), { ssr: false });

interface LocationValues {
  latitude: string;
  longitude: string;
}

/** Ubicación en el mapa (clic para poner el pin) y coordenadas a mano; ambas opcionales. */
export function LocationFields({ readOnly }: { readOnly: boolean }) {
  const { register, setValue, formState } = useFormContext<LocationValues>();
  const [latitude, longitude] = useWatch<LocationValues>({ name: ["latitude", "longitude"] }) as string[];
  const { errors } = formState;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-label font-medium text-foreground">Ubicación (opcional)</p>
        <p className="mt-0.5 text-xs text-muted">Haz clic en el mapa para poner el pin, o escribe las coordenadas.</p>
        <div className="mt-2 overflow-hidden rounded-control">
          <LocationPicker
            latitude={latitude ?? ""}
            longitude={longitude ?? ""}
            disabled={readOnly}
            onChange={(lat, lng) => {
              setValue("latitude", lat, { shouldDirty: true, shouldValidate: true });
              setValue("longitude", lng, { shouldDirty: true, shouldValidate: true });
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Latitud" name="latitude" error={errors.latitude?.message}>
          <TextInput inputMode="decimal" placeholder="-13.04" disabled={readOnly} {...register("latitude")} />
        </Field>
        <Field label="Longitud" name="longitude" error={errors.longitude?.message}>
          <TextInput inputMode="decimal" placeholder="-74.15" disabled={readOnly} {...register("longitude")} />
        </Field>
      </div>
    </div>
  );
}
