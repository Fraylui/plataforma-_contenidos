"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Link as LinkIcon, Plus, X } from "@phosphor-icons/react";
import { CollapsibleCard, TextInput, Button } from "@/components/ui";
import { isValidSourceUrl, MAX_SOURCES, sourceName } from "@/lib/admin/sources";

type WithSources = { sources: { url: string }[] };

/**
 * Fuentes (opcional): si sacaste un dato de algún sitio, pega aquí el
 * enlace. Al final del post salen discretas: «Fuentes: promperu.gob.pe ·
 * inei.gob.pe». Sin formato de universidad: la ley solo pide autor y
 * fuente (D.Leg. 822 art. 44; GUIA-CREAR-CONTENIDO.md §3).
 */
export function SourcesCard({ readOnly }: { readOnly: boolean }) {
  const { control, register } = useFormContext<WithSources>();
  const { fields, append, remove } = useFieldArray({ control, name: "sources" });
  const values = (useWatch({ control, name: "sources" }) ?? []) as { url: string }[];
  return (
    <CollapsibleCard title={fields.length > 0 ? `Fuentes (${fields.length})` : "Fuentes (opcional)"}>
      <p className="text-sm text-muted">
        ¿Sacaste un dato de algún sitio? Pega el enlace. Al final del post se verá así: «Fuentes: promperu.gob.pe · inei.gob.pe».
      </p>
      {fields.length > 0 && (
        <ul className="mt-3 space-y-2">
          {fields.map((field, index) => {
            const value = values[index]?.url ?? "";
            const invalid = value.trim() !== "" && !isValidSourceUrl(value);
            return (
              <li key={field.id}>
                <div className="flex items-center gap-2">
                  <TextInput
                    type="url"
                    inputMode="url"
                    aria-label={`Fuente ${index + 1}`}
                    placeholder="https://…"
                    leading={<LinkIcon aria-hidden="true" />}
                    invalid={invalid}
                    disabled={readOnly}
                    {...register(`sources.${index}.url`)}
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Quitar fuente ${index + 1}`}
                      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-field hover:text-foreground"
                    >
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </div>
                {invalid ? (
                  <p role="alert" className="mt-1 text-xs text-danger-ink">
                    Pega el enlace completo (empieza con https://).
                  </p>
                ) : (
                  value.trim() && <p className="mt-1 text-xs text-muted">Se verá como «{sourceName(value.trim())}».</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!readOnly && fields.length < MAX_SOURCES && (
        <Button variant="secondary" size="sm" className="mt-3" icon={<Plus aria-hidden="true" />} onClick={() => append({ url: "" })}>
          Agregar fuente
        </Button>
      )}
    </CollapsibleCard>
  );
}
