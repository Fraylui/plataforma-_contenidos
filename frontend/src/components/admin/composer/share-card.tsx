"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CollapsibleCard, Combobox, Field, TextArea, TextInput } from "@/components/ui";
import { SharePreview, shareText } from "../share-preview";
import { ROBOTS_OPTIONS, type BaseComposerValues } from "./schema";

/**
 * «Cómo se ve al compartir»: vista previa de Google y redes armada sola con
 * el título, la descripción corta y la portada; texto e imagen propios
 * opcionales; dirección canónica e indexación en Avanzado.
 */
export function ShareCard({
  siteName,
  path,
  coverUrl,
  metaDescriptionDefault,
  readOnly,
}: {
  siteName: string;
  path: string;
  coverUrl: string | null;
  metaDescriptionDefault: string;
  readOnly: boolean;
}) {
  const { control, register, formState } = useFormContext<BaseComposerValues>();
  const { errors } = formState;
  const [title, excerpt, seoTitle, metaDescription, ogImageUrl] = useWatch<BaseComposerValues>({
    name: ["title", "excerpt", "seoTitle", "metaDescription", "ogImageUrl"],
  }) as string[];
  const share = shareText({ title: title ?? "", excerpt: excerpt ?? "", seoTitle: seoTitle ?? "", metaDescription: metaDescription ?? "" });

  return (
    <CollapsibleCard title="Cómo se ve al compartir">
      <SharePreview siteName={siteName} path={path} title={share.title} description={share.description} imageUrl={ogImageUrl?.trim() || coverUrl} />
      <p className="text-sm text-muted">
        Se arma solo con el título, la descripción corta y la portada. Cámbialo solo si quieres otro texto para redes y buscadores.
      </p>
      <Field label="Título para redes y buscadores" name="seoTitle">
        <TextInput placeholder={title || "Por defecto, el título"} disabled={readOnly} {...register("seoTitle")} />
      </Field>
      <Field label="Descripción para redes y buscadores" name="metaDescription">
        <TextArea
          rows={2}
          maxLength={160}
          disabled={readOnly}
          placeholder={excerpt || "Por defecto, la descripción corta"}
          defaultValue={metaDescriptionDefault}
          {...register("metaDescription")}
        />
      </Field>
      <Field label="Otra imagen para compartir (dirección web, opcional)" name="ogImageUrl" error={errors.ogImageUrl?.message}>
        <TextInput type="url" inputMode="url" placeholder="https://…" disabled={readOnly} {...register("ogImageUrl")} />
      </Field>
      <details className="rounded-control bg-field px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-foreground">Avanzado</summary>
        <div className="mt-3 space-y-4 pb-1">
          <Field label="Dirección canónica (si ya se publicó en otro sitio)" name="canonicalUrl" error={errors.canonicalUrl?.message}>
            <TextInput type="url" inputMode="url" placeholder="https://…" disabled={readOnly} {...register("canonicalUrl")} />
          </Field>
          <Field label="Indexación en buscadores" name="robots">
            <Controller
              control={control}
              name="robots"
              render={({ field }) => (
                <Combobox
                  options={ROBOTS_OPTIONS.map((option) => ({ id: option, label: option }))}
                  value={field.value}
                  disabled={readOnly}
                  onSelect={(value) => value && field.onChange(value)}
                />
              )}
            />
          </Field>
        </div>
      </details>
    </CollapsibleCard>
  );
}
