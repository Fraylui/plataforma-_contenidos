-- Módulo Galleries. Galería = colección de fotografías con título y
-- descripción breve, con el mismo flujo editorial que Article/Places/
-- Events (sección 12) — pero sin cuerpo de texto largo: el contenido ES
-- la colección de fotos (la app exige al menos una imagen en
-- GalleryService, no se puede expresar limpio como CHECK sobre la tabla
-- hija de galería-imagen). category_id/geography_id son UUID sin FK:
-- pertenecen a Taxonomy/Geography, no se hacen joins cruzados de esquema
-- (sección 38).

CREATE SCHEMA IF NOT EXISTS galleries;

CREATE TABLE galleries.galleries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                TEXT NOT NULL UNIQUE,
    title               TEXT NOT NULL,
    excerpt             TEXT,
    status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
                            'DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'REJECTED'
                        )),
    author_id           UUID NOT NULL,
    category_id         UUID NOT NULL,
    geography_id        UUID,
    seo_title           TEXT,
    meta_description    TEXT,
    canonical_url       TEXT,
    og_image_url        TEXT,
    robots              TEXT NOT NULL DEFAULT 'index,follow',
    rejection_reason    TEXT,
    published_at        TIMESTAMPTZ,
    scheduled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_galleries_status ON galleries.galleries (status);
CREATE INDEX ix_galleries_author_id ON galleries.galleries (author_id);
CREATE INDEX ix_galleries_category_id ON galleries.galleries (category_id);
CREATE INDEX ix_galleries_geography_id ON galleries.galleries (geography_id);
CREATE INDEX ix_galleries_status_published_at ON galleries.galleries (status, published_at DESC);
CREATE INDEX ix_galleries_status_scheduled_at ON galleries.galleries (status, scheduled_at);

-- Fotos de la galería, mismo patrón que places.place_images/events.event_images.
CREATE TABLE galleries.gallery_images (
    gallery_id  UUID NOT NULL REFERENCES galleries.galleries (id) ON DELETE CASCADE,
    image_id    UUID NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (gallery_id, image_id)
);
