-- Búsqueda interna sobre Reseñas (CONTEXTO.md sección 16) — mismo patrón
-- que V17__event_search.sql (sí hay body largo acá, a diferencia de
-- V19__gallery_search.sql).
ALTER TABLE reviews.reviews ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(excerpt, '')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(body, '')), 'C')
    ) STORED;

CREATE INDEX ix_reviews_search_vector ON reviews.reviews USING GIN (search_vector);
