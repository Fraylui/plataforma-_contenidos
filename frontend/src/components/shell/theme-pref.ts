/**
 * Apariencia elegida por cada visitante (menú "Más"), como en Instagram o
 * X: Sistema / Claro / Oscuro. Vive solo en su navegador
 * (`localStorage["theme-pref"]`) y se aplica con `data-theme` en `<html>`,
 * el mismo atributo que ya pone el layout raíz con la configuración del
 * panel — así globals.css no cambia. Sin preferencia guardada manda la
 * configuración del panel.
 */
export type ThemePref = "system" | "light" | "dark";

export const THEME_PREF_KEY = "theme-pref";

/**
 * Script en línea del `<head>` (antes de pintar, para que no parpadee).
 * Debe coincidir con applyThemePref. try/catch: en ventanas privadas o con
 * datos bloqueados localStorage puede lanzar.
 */
export const themeInitScript = `try{var p=localStorage.getItem("${THEME_PREF_KEY}"),d=document.documentElement;if(p==="light"||p==="dark")d.dataset.theme=p;else if(p==="system")delete d.dataset.theme}catch(e){}`;

/** Preferencia vigente, leída del propio `<html>` (lo guardado o, si no hay, lo del panel). */
export function currentThemePref(): ThemePref {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "system";
}

export function applyThemePref(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;
  try {
    localStorage.setItem(THEME_PREF_KEY, pref);
  } catch {
    // almacenamiento bloqueado: la elección vale para esta visita
  }
}
