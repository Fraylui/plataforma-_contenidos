-- Tolerancia a acentos en el buscador (CONTEXTO.md sección 16): hoy
-- websearch_to_tsquery('spanish', ...) es exacto con acentos — "peru" no
-- encuentra "Perú". unaccent() de Postgres resuelve esto, pero no es
-- IMMUTABLE por defecto (depende del search_path), así que no se puede usar
-- directo dentro de una columna GENERATED ALWAYS AS — necesita un wrapper
-- IMMUTABLE fijado a la extensión/diccionario por nombre completo (receta
-- documentada de Postgres para "unaccent + full text search generado").
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
    SELECT public.unaccent('public.unaccent'::regdictionary, $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- Cada columna search_vector se recrea (no se puede ALTER la expresión de
-- una columna generada) envolviendo cada campo indexado en
-- immutable_unaccent — mismos pesos A/B/C que las migraciones originales
-- (V12/V15/V17/V19/V21/V24), solo agregando la normalización de acentos.

ALTER TABLE content.articles DROP COLUMN search_vector;
ALTER TABLE content.articles ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(excerpt, ''))), 'B') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(body, ''))), 'C')
    ) STORED;
CREATE INDEX ix_articles_search_vector ON content.articles USING GIN (search_vector);

ALTER TABLE places.places DROP COLUMN search_vector;
ALTER TABLE places.places ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(name, ''))), 'A') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(excerpt, ''))), 'B') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(body, ''))), 'C')
    ) STORED;
CREATE INDEX ix_places_search_vector ON places.places USING GIN (search_vector);

ALTER TABLE events.events DROP COLUMN search_vector;
ALTER TABLE events.events ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(excerpt, ''))), 'B') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(body, ''))), 'C')
    ) STORED;
CREATE INDEX ix_events_search_vector ON events.events USING GIN (search_vector);

ALTER TABLE galleries.galleries DROP COLUMN search_vector;
ALTER TABLE galleries.galleries ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(excerpt, ''))), 'B')
    ) STORED;
CREATE INDEX ix_galleries_search_vector ON galleries.galleries USING GIN (search_vector);

ALTER TABLE reviews.reviews DROP COLUMN search_vector;
ALTER TABLE reviews.reviews ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(excerpt, ''))), 'B') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(body, ''))), 'C')
    ) STORED;
CREATE INDEX ix_reviews_search_vector ON reviews.reviews USING GIN (search_vector);

ALTER TABLE directory.businesses DROP COLUMN search_vector;
ALTER TABLE directory.businesses ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(name, ''))), 'A') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(excerpt, ''))), 'B') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(body, ''))), 'C')
    ) STORED;
CREATE INDEX ix_businesses_search_vector ON directory.businesses USING GIN (search_vector);
