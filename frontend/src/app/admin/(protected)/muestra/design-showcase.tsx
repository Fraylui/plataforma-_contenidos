"use client";

import { useState } from "react";
import { FloppyDisk, MagnifyingGlass, PaperPlaneTilt, Trash, X } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  CollapsibleCard,
  Combobox,
  DateTimeInput,
  Field,
  IconButton,
  Radio,
  Select,
  TextArea,
  TextInput,
  type BadgeTone,
} from "@/components/ui";

const TONES: BadgeTone[] = ["neutral", "accent", "success", "warning", "info", "danger"];
const TONE_LABEL: Record<BadgeTone, string> = {
  neutral: "Borrador",
  accent: "Destacado",
  success: "Publicado",
  warning: "Programado",
  info: "Pendiente",
  danger: "Archivado",
};

export function DesignShowcase() {
  const [topic, setTopic] = useState<string | null>("cultura");

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Botones" description="Variantes, tamaños y estados.">
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={<PaperPlaneTilt weight="bold" aria-hidden="true" />}>Publicar</Button>
          <Button variant="secondary" icon={<FloppyDisk aria-hidden="true" />}>
            Guardar borrador
          </Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="danger" icon={<Trash aria-hidden="true" />}>
            Eliminar
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeño</Button>
          <Button size="md">Mediano</Button>
          <Button size="lg">Grande</Button>
          <Button loading>Guardando</Button>
          <Button disabled>Deshabilitado</Button>
          <IconButton label="Buscar" icon={<MagnifyingGlass aria-hidden="true" />} variant="secondary" />
          <IconButton label="Cerrar" icon={<X aria-hidden="true" />} />
        </div>
      </Card>

      <Card title="Estados" description="Etiquetas con fondo tintado.">
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone} dot>
              {TONE_LABEL[tone]}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {TONE_LABEL[tone]}
            </Badge>
          ))}
        </div>
      </Card>

      <Card title="Campos de texto">
        <Field label="Título" name="demo-title" required hint="Así aparece en el feed.">
          <TextInput placeholder="Escribe un título" />
        </Field>
        <Field label="Correo" name="demo-email" error="Escribe un correo válido.">
          <TextInput type="email" defaultValue="hola@" />
        </Field>
        <Field label="Precio" name="demo-price">
          <TextInput type="number" leading="S/" trailing="PEN" defaultValue="25" />
        </Field>
        <Field label="Buscar" name="demo-search">
          <TextInput leading={<MagnifyingGlass aria-hidden="true" />} placeholder="Buscar en el panel" />
        </Field>
        <Field label="Deshabilitado" name="demo-disabled">
          <TextInput disabled defaultValue="No se puede editar" />
        </Field>
      </Card>

      <Card title="Texto largo, listas y fechas">
        <Field label="Descripción corta" name="demo-summary" hint="Se muestra debajo del título.">
          <TextArea maxLength={160} defaultValue="Un recorrido por los mejores lugares para comer en el centro." />
        </Field>
        <Field label="Formato" name="demo-format">
          <Select defaultValue="square">
            <option value="square">Cuadrado</option>
            <option value="portrait">Vertical</option>
            <option value="landscape">Horizontal</option>
          </Select>
        </Field>
        <Field label="Tema" name="demo-topic">
          <Combobox
            options={[
              { id: "cultura", label: "Cultura" },
              { id: "gastronomia", label: "Gastronomía" },
              { id: "viajes", label: "Viajes" },
            ]}
            value={topic}
            onSelect={setTopic}
            placeholder="Elige un tema"
          />
        </Field>
        <Field label="Empieza" name="demo-start">
          <DateTimeInput defaultValue="2026-12-12T19:00" />
        </Field>
        <Field label="Fecha" name="demo-date">
          <DateTimeInput type="date" defaultValue="2026-12-24" />
        </Field>
      </Card>

      <Card title="Opciones">
        <Checkbox label="Destacar en el inicio" description="Aparece primero en el feed." defaultChecked />
        <Checkbox label="Permitir compartir" />
        <Checkbox label="Deshabilitada" disabled />
        <div className="space-y-3 pt-2" role="radiogroup" aria-label="Visibilidad">
          <Radio name="demo-visibility" value="public" label="Pública" description="Cualquiera puede verla." defaultChecked />
          <Radio name="demo-visibility" value="hidden" label="Oculta" description="Solo con el enlace." />
        </div>
      </Card>

      <CollapsibleCard title="Cómo se ve al compartir">
        <Field label="Título para redes" name="demo-og-title">
          <TextInput placeholder="Por defecto, el título" />
        </Field>
      </CollapsibleCard>
    </div>
  );
}
