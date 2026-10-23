-- Historias (2026-10-23, spec docs/superpowers/specs/2026-10-23-historias-design.md):
-- foto o fondo de color + texto corto, agrupadas por tema, que se ven 24 h
-- (o siempre, si son Destacadas). Como en live.streams, sin claves foráneas
-- hacia otros módulos: el servicio valida tema e imagen, y ImageUsages impide
-- borrar una foto en uso.
CREATE SCHEMA IF NOT EXISTS stories;

CREATE TABLE stories.stories (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id        UUID NOT NULL,
    image_id           UUID,
    background         TEXT CHECK (background IN ('SUNSET', 'OCEAN', 'FOREST', 'NIGHT')),
    caption            TEXT CHECK (char_length(caption) <= 140),
    caption_position   TEXT NOT NULL DEFAULT 'BOTTOM' CHECK (caption_position IN ('TOP', 'CENTER', 'BOTTOM')),
    link_content_type  TEXT CHECK (link_content_type IN ('PUBLICATION', 'PLACE', 'CELEBRATION', 'GALLERY')),
    link_content_id    UUID,
    youtube_video_id   TEXT CHECK (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
    highlighted        BOOLEAN NOT NULL DEFAULT false,
    published_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at         TIMESTAMPTZ NOT NULL,
    cta_clicks         INTEGER NOT NULL DEFAULT 0 CHECK (cta_clicks >= 0),
    author_id          UUID NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Foto o fondo de color, nunca los dos ni ninguno.
    CONSTRAINT story_has_visual CHECK ((image_id IS NULL) <> (background IS NULL)),
    CONSTRAINT story_text_only_needs_caption CHECK (image_id IS NOT NULL OR caption IS NOT NULL),
    CONSTRAINT story_one_link CHECK (link_content_id IS NULL OR youtube_video_id IS NULL),
    CONSTRAINT story_link_pair CHECK ((link_content_type IS NULL) = (link_content_id IS NULL))
);

-- Activas (expires_at > now()) por tema, y Destacadas de un tema.
CREATE INDEX ix_stories_active ON stories.stories (expires_at DESC, category_id);
CREATE INDEX ix_stories_highlighted ON stories.stories (category_id, published_at DESC) WHERE highlighted;

ALTER TABLE media.images DROP CONSTRAINT ck_images_purpose;
ALTER TABLE media.images ADD CONSTRAINT ck_images_purpose CHECK (purpose IN ('CONTENT', 'AD', 'STORY'));

ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_module_check;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_module_check CHECK (module IN (
    'PUBLICATIONS', 'PLACES', 'CELEBRATIONS', 'GALLERIES', 'SERIES', 'STORIES',
    'CATEGORIES', 'STATS', 'ADVERTISING', 'WORKERS', 'SETTINGS'));
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_level_by_module;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_level_by_module CHECK (
    (module IN ('PUBLICATIONS', 'PLACES', 'CELEBRATIONS', 'GALLERIES', 'SERIES', 'STORIES') AND level = 'PUBLISH')
    OR (module IN ('CATEGORIES', 'STATS', 'ADVERTISING', 'WORKERS', 'SETTINGS') AND level = 'ACCESS'));
