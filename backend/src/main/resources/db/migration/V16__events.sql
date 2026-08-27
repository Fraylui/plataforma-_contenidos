-- Módulo Events. Evento = página de contenido propia (título, descripción,
-- fecha/hora de inicio-fin, lugar opcional, fotografías, video, categoría)
-- con el mismo flujo editorial que Article/Places (sección 12) — Eventos es
-- un tipo de contenido más (sección 3). category_id/geography_id/place_id
-- son UUID sin FK: pertenecen a Taxonomy/Geography/Places, no se hacen
-- joins cruzados de esquema (sección 38). A diferencia de Article/Place, el
-- listado público separa activamente "próximos" de "pasados" por
-- starts_at, en vez de ordenar todo por published_at.

CREATE SCHEMA IF NOT EXISTS events;

CREATE TABLE events.events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                TEXT NOT NULL UNIQUE,
    title               TEXT NOT NULL,
    excerpt             TEXT,
    body                TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
                            'DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'REJECTED'
                        )),
    author_id           UUID NOT NULL,
    category_id         UUID NOT NULL,
    geography_id        UUID,
    place_id            UUID,
    venue_name          TEXT,
    starts_at           TIMESTAMPTZ NOT NULL,
    ends_at             TIMESTAMPTZ,
    youtube_video_id    TEXT,
    seo_title           TEXT,
    meta_description    TEXT,
    canonical_url       TEXT,
    og_image_url        TEXT,
    robots              TEXT NOT NULL DEFAULT 'index,follow',
    rejection_reason    TEXT,
    published_at        TIMESTAMPTZ,
    scheduled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT events_ends_after_starts CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX ix_events_status ON events.events (status);
CREATE INDEX ix_events_author_id ON events.events (author_id);
CREATE INDEX ix_events_category_id ON events.events (category_id);
CREATE INDEX ix_events_geography_id ON events.events (geography_id);
CREATE INDEX ix_events_place_id ON events.events (place_id);
CREATE INDEX ix_events_status_starts_at ON events.events (status, starts_at);
CREATE INDEX ix_events_status_scheduled_at ON events.events (status, scheduled_at);

-- Galería, mismo patrón que places.place_images — image_id sin FK (Media, sección 38).
CREATE TABLE events.event_images (
    event_id    UUID NOT NULL REFERENCES events.events (id) ON DELETE CASCADE,
    image_id    UUID NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, image_id)
);
