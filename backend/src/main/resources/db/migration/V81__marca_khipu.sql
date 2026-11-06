-- Marca del sitio: khipu (logo del dueño, 2026-11-05). Solo reemplaza los
-- valores de ejemplo; si alguien ya los cambió en Configuración, se respetan.
-- El logo es el ícono cuadrado (estrella amarilla sobre negro) que se ve
-- junto al nombre y en cada post; los archivos viven en frontend/public/brand.
UPDATE configuration.platform_settings SET name = 'khipu' WHERE name = 'Plataforma de Contenidos';
UPDATE configuration.platform_settings SET logo_url = '/brand/khipu-icono.png' WHERE logo_url IS NULL OR logo_url = '';
UPDATE configuration.platform_settings SET favicon_url = '/brand/favicon-32.png' WHERE favicon_url IS NULL OR favicon_url = '';
