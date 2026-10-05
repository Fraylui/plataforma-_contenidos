/**
 * Etiqueta de caché de TODO lo que el sitio público pide al backend (ver
 * apiFetch en lib/api/client.ts). Cualquier cambio hecho desde el panel
 * (runAdminMutation) la invalida, así una publicación nueva o editada se
 * ve al instante aunque las páginas queden en caché varios minutos.
 * Una sola etiqueta a propósito: con un equipo chico publicando, invalidar
 * todo en cada cambio cuesta nada y evita que alguna página quede vieja
 * por olvidar su etiqueta específica.
 */
export const PUBLIC_CONTENT_TAG = "public-content";
