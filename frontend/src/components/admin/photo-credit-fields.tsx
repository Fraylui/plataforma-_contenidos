"use client";

import { useId } from "react";
import { Checkbox, Radio, TextInput } from "@/components/ui";
import { CREDIT_MAX, photoCreditError } from "@/lib/admin/photo-credit";

/**
 * ¿De quién es la foto? Propia (lo normal) o de otra persona: entonces su
 * nombre (sale como «Foto: …») y la confirmación de que hay permiso por
 * escrito o licencia libre sin «NC». Citar no reemplaza el permiso
 * (D.Leg. 822 art. 39; GUIA-CREAR-CONTENIDO.md §4).
 */
export function PhotoCreditFields({
  index,
  credit,
  rightsConfirmed,
  onChange,
  disabled,
  showError,
}: {
  index: number;
  credit: string | null | undefined;
  rightsConfirmed: boolean | undefined;
  onChange: (patch: { credit: string | null; rightsConfirmed: boolean }) => void;
  disabled?: boolean;
  showError?: boolean;
}) {
  const name = useId();
  const someoneElse = credit !== null && credit !== undefined;
  const error = showError ? photoCreditError(credit, rightsConfirmed) : null;
  return (
    <fieldset className="space-y-1.5 pt-1" disabled={disabled}>
      <legend className="text-xs font-medium text-foreground">¿De quién es la foto {index + 1}?</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Radio name={name} label="Mía" checked={!someoneElse} onChange={() => onChange({ credit: null, rightsConfirmed: false })} />
        <Radio
          name={name}
          label="De otra persona"
          checked={someoneElse}
          onChange={() => onChange({ credit: credit ?? "", rightsConfirmed: rightsConfirmed ?? false })}
        />
      </div>
      {someoneElse && (
        <div className="space-y-2 rounded-control bg-field p-2.5">
          <TextInput
            aria-label={`Autor de la foto ${index + 1}`}
            placeholder="Nombre del autor (sale como «Foto: …»)"
            value={credit ?? ""}
            maxLength={CREDIT_MAX}
            invalid={Boolean(error) && !credit?.trim()}
            onChange={(event) => onChange({ credit: event.target.value, rightsConfirmed: rightsConfirmed ?? false })}
          />
          <Checkbox
            label="Tengo su permiso por escrito o una licencia libre"
            description="Un WhatsApp o correo guardado sirve. Licencias libres: CC0, CC BY o CC BY-SA (no las «NC»). Citar no reemplaza el permiso."
            checked={Boolean(rightsConfirmed)}
            onChange={(event) => onChange({ credit: credit ?? "", rightsConfirmed: event.target.checked })}
          />
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs font-medium text-danger-ink">
          {error}
        </p>
      )}
    </fieldset>
  );
}
