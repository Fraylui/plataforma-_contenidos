-- Módulo Reviews. Reseña = opinión con calificación (1-5) sobre un Lugar
-- existente (place_id) o algo que todavía no tiene página propia
-- (subject_name libre — mismo patrón que events.place_id/venue_name),
-- con el mismo flujo editorial que Article/Places/Events (sección 12).
-- category_id/geography_id/place_id son UUID sin FK: pertenecen a
-- Taxonomy/Geography/Places, no se hacen joins cruzados de esquema
-- (sección 38). A diferencia de Galería, sí tiene body de texto largo.

CREATE SCHEMA IF NOT EXISTS reviews;

CREATE TABLE reviews.reviews (
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
    subject_name        TEXT,
    rating              INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
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

CREATE INDEX ix_reviews_status ON reviews.reviews (status);
CREATE INDEX ix_reviews_author_id ON reviews.reviews (author_id);
CREATE INDEX ix_reviews_category_id ON reviews.reviews (category_id);
CREATE INDEX ix_reviews_geography_id ON reviews.reviews (geography_id);
CREATE INDEX ix_reviews_place_id ON reviews.reviews (place_id);
CREATE INDEX ix_reviews_status_published_at ON reviews.reviews (status, published_at DESC);
CREATE INDEX ix_reviews_status_scheduled_at ON reviews.reviews (status, scheduled_at);

-- Fotos, mismo patrón que places.place_images/events.event_images.
CREATE TABLE reviews.review_images (
    review_id   UUID NOT NULL REFERENCES reviews.reviews (id) ON DELETE CASCADE,
    image_id    UUID NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (review_id, image_id)
);
