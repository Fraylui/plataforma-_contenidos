"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AdminImage, Advertiser } from "@/lib/api/admin-types";
import {
  createAdvertiserAction,
  updateAdvertiserAction,
  type ActionResult,
} from "@/app/admin/(protected)/anunciantes/actions";
import { FormError } from "@/components/admin/ui";
import { Button, Field, TextInput } from "@/components/ui";
import { CampaignCreativePicker } from "@/components/admin/campaign-creative-picker";

interface AdvertiserFormProps {
  mode: "create" | "edit";
  advertiser?: Advertiser;
  allImages: AdminImage[];
}

export function AdvertiserForm({ mode, advertiser, allImages }: AdvertiserFormProps) {
  const [name, setName] = useState(advertiser?.name ?? "");
  const [contactEmail, setContactEmail] = useState(advertiser?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(advertiser?.contactPhone ?? "");
  const [logoImageId, setLogoImageId] = useState<string | null>(advertiser?.logoImageId ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const input = {
      name,
      contactEmail: contactEmail.trim() || null,
      contactPhone: contactPhone.trim() || null,
      logoImageId,
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
    <div className="max-w-lg space-y-4 rounded-card bg-surface shadow-card p-5">
      <Field label="Nombre del negocio/empresa" name="name">
        <TextInput type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <fieldset className="min-w-0">
        <legend className="mb-1.5 block text-label font-medium text-foreground">Logo (opcional)</legend>
        <p className="mb-2 text-xs text-muted">
          Encabeza sus posts patrocinados en el feed, como la foto de perfil en Instagram. Cuadrado, de 400×400 px o más. Sin
          logo se muestra la inicial del nombre.
        </p>
        <CampaignCreativePicker
          allImages={allImages}
          value={{ imageId: logoImageId, externalImageUrl: null, imageAlt: null }}
          onChange={(v) => setLogoImageId(v.imageId)}
          allowExternal={false}
          showAlt={false}
          previewClassName="size-20 rounded-full"
        />
      </fieldset>

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
