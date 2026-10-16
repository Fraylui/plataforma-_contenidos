const TOP_LEVEL: Record<string, string> = {
  "/": "Inicio",
  "/explorar": "Explorar",
  "/buscar": "Buscar",
  "/agenda": "Agenda",
  "/publicaciones": "Publicaciones",
  "/lugares": "Lugares",
  "/galerias": "Galerías",
  "/directorio": "Directorio",
  "/series": "Series",
  "/en-vivo": "En vivo",
};

const DETAIL: Record<string, string> = {
  "/publicaciones": "Publicación",
  "/lugares": "Lugar",
  "/agenda": "Fecha",
  "/galerias": "Galería",
  "/directorio": "Directorio",
  "/series": "Serie",
  "/en-vivo": "En vivo",
  "/categorias": "Tema",
};

const STATIC_PAGES: Record<string, string> = {
  "/contacto": "Contacto",
  "/privacidad": "Privacidad",
  "/terminos": "Términos",
};

/**
 * Título de la franja superior según la ruta, como el encabezado de X:
 * el nombre de la pantalla, y en un detalle el tipo de contenido con una
 * flecha para volver a su sección. Los temas vuelven al inicio (no hay
 * listado de temas propio: son los círculos del feed).
 */
export function pageTitle(pathname: string): { title: string; back: string | null } {
  if (TOP_LEVEL[pathname]) return { title: TOP_LEVEL[pathname], back: null };
  if (STATIC_PAGES[pathname]) return { title: STATIC_PAGES[pathname], back: "/" };
  const section = `/${pathname.split("/")[1] ?? ""}`;
  if (DETAIL[section]) return { title: DETAIL[section], back: section === "/categorias" ? "/" : section };
  return { title: "", back: "/" };
}
