-- Transmisiones en vivo (decisión del dueño 2026-10-15): se transmiten en
-- YouTube y se ven dentro del sitio. Sin clave de API: quien tiene el módulo
-- Series las programa y marca "Estamos en vivo" / "Terminar" en el panel; una
-- tarea apaga sola la que siga en vivo después de 12 horas.
CREATE SCHEMA IF NOT EXISTS live;

CREATE TABLE live.streams (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug              TEXT NOT NULL UNIQUE,
    title             TEXT NOT NULL,
    description       TEXT,
    youtube_video_id  TEXT NOT NULL CHECK (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
    category_id       UUID NOT NULL,
    series_id         UUID REFERENCES series.series(id) ON DELETE SET NULL,
    author_id         UUID NOT NULL,
    status            TEXT NOT NULL DEFAULT 'SCHEDULED'
                      CONSTRAINT streams_status_check CHECK (status IN ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED')),
    scheduled_start   TIMESTAMPTZ,
    started_at        TIMESTAMPTZ,
    ended_at          TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "¿Hay algo en vivo?" y "próximas transmisiones": consultas por estado.
CREATE INDEX idx_streams_status ON live.streams(status, scheduled_start);
