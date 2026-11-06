-- Series conectadas a una lista de reproducción de YouTube (decisión del
-- dueño 2026-10-15): los programas se transmiten en YouTube y el sitio los
-- muestra como series con episodios; los videos nuevos se publican solos
-- (ver series.SeriesSyncJob). Mismo patrón que el resto: category_id y
-- author_id son UUID sin FK cross-schema.
CREATE SCHEMA IF NOT EXISTS series;

CREATE TABLE series.series (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                TEXT NOT NULL UNIQUE,
    title               TEXT NOT NULL,
    description         TEXT,
    category_id         UUID NOT NULL,
    author_id           UUID NOT NULL,
    youtube_playlist_id TEXT NOT NULL UNIQUE,
    status              TEXT NOT NULL DEFAULT 'DRAFT'
                        CONSTRAINT series_status_check CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
    published_at        TIMESTAMPTZ,
    scheduled_at        TIMESTAMPTZ,
    last_synced_at      TIMESTAMPTZ,
    last_sync_error     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_series_status ON series.series(status);

CREATE TABLE series.episodes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id         UUID NOT NULL REFERENCES series.series(id) ON DELETE CASCADE,
    youtube_video_id  TEXT NOT NULL CHECK (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
    slug              TEXT NOT NULL,
    title             TEXT NOT NULL,
    description       TEXT,
    -- Texto propio del equipo (no la descripción copiada de YouTube): valor para
    -- el lector y para AdSense/Google, que penalizan páginas con solo un video.
    notes             TEXT,
    published_at      TIMESTAMPTZ NOT NULL,
    status            TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'ARCHIVED')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (series_id, youtube_video_id),
    UNIQUE (series_id, slug)
);

CREATE INDEX idx_episodes_series_published ON series.episodes(series_id, status, published_at DESC);

-- Módulo de contenido nuevo para los trabajadores.
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_module_check;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_module_check CHECK (module IN (
    'ARTICLES','PLACES','EVENTS','GALLERIES','DIRECTORY','SERIES','CATEGORIES','STATS','ADVERTISING','WORKERS','SETTINGS'));
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_level_by_module;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_level_by_module CHECK (
    (module IN ('ARTICLES','PLACES','EVENTS','GALLERIES','DIRECTORY','SERIES') AND level = 'PUBLISH')
    OR (module IN ('CATEGORIES','STATS','ADVERTISING','WORKERS','SETTINGS') AND level = 'ACCESS'));

-- Quien ya publicaba en todo (plantillas Publicador/Administrador) también publica series.
INSERT INTO identity.worker_permissions (user_id, module, level)
SELECT p.user_id, 'SERIES', 'PUBLISH'
  FROM identity.worker_permissions p
 GROUP BY p.user_id
HAVING count(*) FILTER (WHERE p.module IN ('ARTICLES','PLACES','EVENTS','GALLERIES','DIRECTORY')) = 5;
