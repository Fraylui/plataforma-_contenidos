/**
 * Cookie (no localStorage) del menú lateral plegado: el servidor la lee para
 * dibujarlo ya plegado, sin saltos al cargar. Vive aparte de sidebar.tsx
 * ("use client"): una constante de un módulo de cliente no se puede leer en el servidor.
 */
export const SIDEBAR_COOKIE = "admin_sidebar";
