-- Búsqueda interna sobre Galerías (CONTEXTO.md sección 16) — mismo patrón
-- que V17__event_search.sql. Solo title+excerpt: no hay body que indexar.
ALTER TABLE galleries.galleries ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(excerpt, '')), 'B')
    ) STORED;

CREATE INDEX ix_galleries_search_vector ON galleries.galleries USING GIN (search_vector);
