/**
 * Zona horaria en la que se leen las fechas del sitio (eventos, publicaciones,
 * panel). Sin esto cada fecha salía en la zona de la máquina que dibuja la
 * página: el servidor (Docker, UTC) mostraba un evento de las 11 p. m. de Lima
 * como el día siguiente a las 4 a. m. Configurable para un sitio de otro país.
 */
export const SITE_TIME_ZONE = process.env.NEXT_PUBLIC_SITE_TIME_ZONE || "America/Lima";
