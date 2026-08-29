-- Campos de configuration.platform_settings que nunca se mostraron en el sitio
-- público (ver auditoría 2026-08-29): se guardaban desde el admin pero no
-- tenían ningún consumidor en el frontend.
ALTER TABLE configuration.platform_settings
    DROP COLUMN slogan,
    DROP COLUMN facebook_url,
    DROP COLUMN instagram_url,
    DROP COLUMN tiktok_url,
    DROP COLUMN youtube_url,
    DROP COLUMN contact_phone,
    DROP COLUMN contact_address;
