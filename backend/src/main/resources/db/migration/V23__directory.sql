-- Módulo Directorio (CONTEXTO.md sección 6: Empresas, Restaurantes,
-- Hoteles, Servicios/negocios locales). Mismo flujo editorial que
-- Article/Places/Events/Reviews (sección 12). A diferencia de Reseña
-- (que opina sobre un lugar), una ficha de Directorio ES el negocio:
-- puede vincularse a un Lugar ya existente (place_id) o llevar su propia
-- dirección libre (address), mismo patrón que events.place_id/venue_name.
-- category_id/geography_id/place_id son UUID sin FK (Taxonomy/Geography/
-- Places, sección 38).

CREATE SCHEMA IF NOT EXISTS directory;

CREATE TABLE directory.businesses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    excerpt             TEXT,
    body                TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
                            'DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'REJECTED'
                        )),
    business_type       TEXT NOT NULL CHECK (business_type IN (
                            'RESTAURANT', 'HOTEL', 'SERVICE', 'SHOP', 'OTHER'
                        )),
    author_id           UUID NOT NULL,
    category_id         UUID NOT NULL,
    geography_id        UUID,
    place_id            UUID,
    address             TEXT,
    phone               TEXT,
    email               TEXT,
    website             TEXT,
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
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_businesses_status ON directory.businesses (status);
CREATE INDEX ix_businesses_author_id ON directory.businesses (author_id);
CREATE INDEX ix_businesses_category_id ON directory.businesses (category_id);
CREATE INDEX ix_businesses_geography_id ON directory.businesses (geography_id);
CREATE INDEX ix_businesses_place_id ON directory.businesses (place_id);
CREATE INDEX ix_businesses_business_type ON directory.businesses (business_type);
CREATE INDEX ix_businesses_status_published_at ON directory.businesses (status, published_at DESC);
CREATE INDEX ix_businesses_status_scheduled_at ON directory.businesses (status, scheduled_at);

-- Fotos, mismo patrón que reviews.review_images/places.place_images.
CREATE TABLE directory.business_images (
    business_id UUID NOT NULL REFERENCES directory.businesses (id) ON DELETE CASCADE,
    image_id    UUID NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (business_id, image_id)
);
