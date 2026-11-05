-- El logo de khipu se usa tal cual lo entregó el dueño (sin recortes ni
-- versiones derivadas): reemplaza los archivos que puso V81.
UPDATE configuration.platform_settings SET logo_url = '/brand/khipu.png' WHERE logo_url = '/brand/khipu-icono.png';
UPDATE configuration.platform_settings SET favicon_url = '/brand/khipu.png' WHERE favicon_url = '/brand/favicon-32.png';
