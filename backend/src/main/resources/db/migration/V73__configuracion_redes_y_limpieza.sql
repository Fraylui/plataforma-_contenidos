-- Configuración (dueño 2026-10-21): «tiene que ser intuitiva, hay cosas
-- inconsistentes»; y las redes oficiales de la plataforma.
--
-- 1) Redes oficiales: solo enlaces (sin APIs).
ALTER TABLE configuration.platform_settings
    ADD COLUMN youtube_url   TEXT,
    ADD COLUMN instagram_url TEXT,
    ADD COLUMN tiktok_url    TEXT,
    ADD COLUMN facebook_url  TEXT,
    ADD COLUMN x_url         TEXT;

-- 2) Duplicados: había dos descripciones y dos imágenes para compartir; el
--    sitio usaba la «SEO» si existía. Se conserva ese valor en el campo único.
UPDATE configuration.platform_settings
SET description  = COALESCE(NULLIF(seo_default_description, ''), description),
    og_image_url = COALESCE(NULLIF(seo_default_image_url, ''), og_image_url);

-- 3) Campos sin uso (colores y tipografía desde 2026-08-29; short_name no se
--    podía editar y solo lo leía el RSS).
ALTER TABLE configuration.platform_settings
    DROP COLUMN seo_default_description,
    DROP COLUMN seo_default_image_url,
    DROP COLUMN primary_color,
    DROP COLUMN secondary_color,
    DROP COLUMN background_color,
    DROP COLUMN font_family,
    DROP COLUMN short_name;
