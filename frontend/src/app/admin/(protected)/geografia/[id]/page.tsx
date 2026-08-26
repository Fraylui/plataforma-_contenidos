import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { getGeographyUnitById, NotFoundError } from "@/lib/api/client";
import { geographyLevelLabel } from "@/lib/content-labels";
import { GeographyRenameForm } from "@/components/admin/geography-rename-form";
import { setGeographyActiveAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar unidad geográfica",
  robots: "noindex,nofollow",
};

export default async function EditGeographyPage(props: PageProps<"/admin/geografia/[id]">) {
  const { id } = await props.params;
  await requireAdminUser();

  let unit;
  try {
    unit = await getGeographyUnitById(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const parent = unit.parentId ? await getGeographyUnitById(unit.parentId).catch(() => null) : null;

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium text-foreground">{unit.name}</h1>
      <p className="mt-2 text-sm text-muted">
        {geographyLevelLabel(unit.level)}
        {parent && <> · dentro de {parent.name}</>}
        {" — "}
        el nivel y el padre no se pueden cambiar una vez creada la unidad.
      </p>

      <div className="mt-6 flex items-center gap-3 text-sm">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            unit.active ? "bg-accent-soft text-accent" : "bg-border text-muted"
          }`}
        >
          {unit.active ? "Activa" : "Inactiva"}
        </span>
        <form action={setGeographyActiveAction.bind(null, unit.id, !unit.active)}>
          <button type="submit" className="text-xs font-medium text-muted underline underline-offset-2 hover:text-accent">
            {unit.active ? "Desactivar" : "Activar"}
          </button>
        </form>
      </div>

      <div className="mt-6">
        <GeographyRenameForm unit={unit} />
      </div>
    </div>
  );
}
