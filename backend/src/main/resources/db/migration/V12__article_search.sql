-- Búsqueda interna (CONTEXTO.md sección 16): PostgreSQL full-text search
-- para el MVP, con una columna generada + índice GIN. La arquitectura no
-- ata el resto del sistema a Postgres para esto — si el volumen de
-- contenido lo justifica más adelante, se reemplaza/complementa con
-- OpenSearch/Elasticsearch sin tocar el contrato público (GET /api/v1/search).
-- 'spanish' porque el contenido inicial es en español (sección 1: Perú).
ALTER TABLE content.articles ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('spanish', coalesce(excerpt, '')), 'B') ||
        setweight(to_tsvector('spanish', coalesce(body, '')), 'C')
    ) STORED;

CREATE INDEX ix_articles_search_vector ON content.articles USING GIN (search_vector);
