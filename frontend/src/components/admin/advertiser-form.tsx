"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Advertiser } from "@/lib/api/admin-types";
import {
  createAdvertiserAction,
  updateAdvertiserAction,
  type ActionResult,
} from "@/app/admin/(protected)/anunciantes/actions";
import { FormError } from "@/components/admin/ui";
import { Button, Field, TextInput } from "@/components/ui";

interface AdvertiserFormProps {
  mode: "create" | "edit";
  advertiser?: Advertiser;
}

export function AdvertiserForm({ mode, advertiser }: AdvertiserFormProps) {
  const [name, setName] = useState(advertiser?.name ?? "");
  const [contactEmail, setContactEmail] = useState(advertiser?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(advertiser?.contactPhone ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const input = {
      name,
      contactEmail: contactEmail.trim() || null,
      contactPhone: contactPhone.trim() || null,
    };
    const result: ActionResult =
      mode === "create" ? await createAdvertiserAction(input) : await updateAdvertiserAction(advertiser!.id, input);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Guardado.");
  }

  return (
    <div className="max-w-lg space-y-4 rounded-xl border border-border/60 bg-surface p-5">
      <Field label="Nombre del negocio/empresa" name="name">
        <TextInput type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Email de contacto (opcional)" name="contactEmail">
        <TextInput
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </Field>

      <Field label="Teléfono de contacto (opcional)" name="contactPhone">
        <TextInput
          type="text"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
        />
      </Field>

      {error && <FormError message={error} />}
      <Button type="submit" disabled={pending || !name.trim()} onClick={handleSubmit}>
        {pending ? "Guardando…" : mode === "create" ? "Crear anunciante" : "Guardar cambios"}
      </Button>
    </div>
  );
}
