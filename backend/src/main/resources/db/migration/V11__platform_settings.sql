-- Configuración de identidad de plataforma (CONTEXTO.md sección 14): nombre,
-- marca, SEO por defecto, redes y contacto, editable desde el panel admin sin
-- redeploy. Fila única: el constraint UNIQUE sobre singleton_guard impide
-- insertar una segunda fila a nivel de base de datos.
CREATE SCHEMA IF NOT EXISTS configuration;

CREATE TABLE configuration.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    singleton_guard BOOLEAN NOT NULL DEFAULT true,

    name TEXT NOT NULL,
    short_name TEXT,
    description TEXT,
    slogan TEXT,
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    og_image_url TEXT,

    primary_color TEXT,
    secondary_color TEXT,
    background_color TEXT,
    font_family TEXT,
    theme TEXT NOT NULL DEFAULT 'AUTO',

    seo_default_title TEXT,
    seo_default_description TEXT,
    seo_default_image_url TEXT,
    google_search_console_verification TEXT,

    facebook_url TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    youtube_url TEXT,

    contact_email TEXT,
    contact_phone TEXT,
    contact_address TEXT,

    adsense_enabled BOOLEAN NOT NULL DEFAULT false,
    adsense_client_id TEXT,
    analytics_id TEXT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,

    CONSTRAINT platform_settings_singleton UNIQUE (singleton_guard)
);

-- Fila inicial con valores de ejemplo (sección 14.3: solo como seed de
-- desarrollo, nunca como literal cableado en código/markup).
INSERT INTO configuration.platform_settings (name, description)
VALUES ('Plataforma de Contenidos', 'Sistema de gestión y distribución de contenidos digitales.');
