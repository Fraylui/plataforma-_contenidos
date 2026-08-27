-- Búsqueda interna sobre Lugares (CONTEXTO.md sección 16) — mismo patrón
-- que V12__article_search.sql sobre content.articles. Antes la búsqueda
-- solo cubría Artículos; con esto, GET /api/v1/search puede agregar
-- resultados de ambos módulos (ver módulo `search` nuevo).
ALTER TABLE places.places ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(excerpt, '')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(body, '')), 'C')
    ) STORED;

CREATE INDEX ix_places_search_vector ON places.places USING GIN (search_vector);
