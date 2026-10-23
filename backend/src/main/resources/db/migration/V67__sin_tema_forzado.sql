-- El sitio sigue al dispositivo del visitante (modo claro u oscuro), sin
-- selector (decisión del dueño 2026-10-06, y quitado de Configuración
-- 2026-10-16): la opción de forzar un tema para todo el sitio ya no existe.
ALTER TABLE configuration.platform_settings DROP COLUMN theme;
