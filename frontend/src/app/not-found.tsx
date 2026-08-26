import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-serif text-6xl font-medium text-accent">404</p>
      <h1 className="mt-4 font-serif text-2xl font-medium text-foreground">
        No encontramos esta página
      </h1>
      <p className="mt-2 text-sm text-muted">
        El contenido pudo haberse movido, no existir o no estar publicado.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
