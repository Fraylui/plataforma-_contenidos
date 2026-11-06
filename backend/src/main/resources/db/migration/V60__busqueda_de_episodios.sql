-- Episodios en el buscador (CONTEXTO.md §16 y §46.6k D10) — mismo patrón que
-- V36__search_unaccent.sql. Las notas son HTML saneado: el analizador de
-- PostgreSQL reconoce las etiquetas como tokens "tag" y la configuración
-- 'spanish' no las indexa, así que solo entra el texto.
ALTER TABLE series.episodes ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(notes, ''))), 'B') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(description, ''))), 'C')
    ) STORED;
CREATE INDEX ix_episodes_search_vector ON series.episodes USING GIN (search_vector);

-- Buscar el nombre del programa trae sus episodios.
ALTER TABLE series.series ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
        setweight(to_tsvector('spanish', public.immutable_unaccent(coalesce(description, ''))), 'B')
    ) STORED;
CREATE INDEX ix_series_search_vector ON series.series USING GIN (search_vector);
