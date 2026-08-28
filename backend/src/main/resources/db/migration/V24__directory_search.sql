-- Búsqueda interna sobre Directorio (CONTEXTO.md sección 16) — mismo
-- patrón que V21__review_search.sql: título con más peso, luego extracto,
-- luego cuerpo.
ALTER TABLE directory.businesses ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(excerpt, '')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(body, '')), 'C')
    ) STORED;

CREATE INDEX ix_businesses_search_vector ON directory.businesses USING GIN (search_vector);
