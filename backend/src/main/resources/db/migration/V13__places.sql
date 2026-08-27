-- Módulo Places (CONTEXTO.md sección 6). Lugar = página de contenido propia
-- (nombre, descripción/historia, ubicación, coordenadas, fotografías,
-- video, categoría) con el mismo flujo editorial que Content (sección 12) —
-- Lugares es un tipo de contenido más (sección 3). category_id/geography_id
-- son UUID sin FK: pertenecen a Taxonomy/Geography, no se hacen joins
-- cruzados de esquema (sección 38). Los "artículos relacionados" (sección
-- 6) no se persisten aquí: se derivan en tiempo de lectura a partir de
-- geography_id compartido con content.articles (mismo patrón que la
-- sección 4, "Turismo → Ayacucho → Huamanga").

CREATE SCHEMA IF NOT EXISTS places;

CREATE TABLE places.places (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    excerpt             TEXT,
    body                TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
                            'DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'REJECTED'
                        )),
    author_id           UUID NOT NULL,
    category_id         UUID NOT NULL,
    geography_id        UUID,
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
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

    CONSTRAINT places_latitude_range CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT places_longitude_range CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE INDEX ix_places_status ON places.places (status);
CREATE INDEX ix_places_author_id ON places.places (author_id);
CREATE INDEX ix_places_category_id ON places.places (category_id);
CREATE INDEX ix_places_geography_id ON places.places (geography_id);
CREATE INDEX ix_places_status_published_at ON places.places (status, published_at DESC);
CREATE INDEX ix_places_status_scheduled_at ON places.places (status, scheduled_at);

-- Galería (sección 6, "Fotografías") — image_id sin FK por el mismo motivo
-- que category_id/geography_id: pertenece a Media (sección 38).
CREATE TABLE places.place_images (
    place_id    UUID NOT NULL REFERENCES places.places (id) ON DELETE CASCADE,
    image_id    UUID NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (place_id, image_id)
);
