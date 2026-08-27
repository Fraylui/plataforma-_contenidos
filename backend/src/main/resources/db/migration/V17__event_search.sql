-- Búsqueda interna sobre Eventos (CONTEXTO.md sección 16) — mismo patrón
-- que V15__place_search.sql sobre places.places.
ALTER TABLE events.events ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(excerpt, '')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(body, '')), 'C')
    ) STORED;

CREATE INDEX ix_events_search_vector ON events.events USING GIN (search_vector);
