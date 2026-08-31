-- "Me gusta" en Artículos: anónimo, deduplicado por visitor_id (UUID generado
-- y persistido en el navegador del lector, ver frontend lib/visitor-id.ts).
-- No requiere cuenta de usuario -- es una señal de lectores, no de la
-- comunidad editorial (esa ya tiene su propio modelo en identity/).
CREATE TABLE content.article_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES content.articles(id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (article_id, visitor_id)
);

CREATE INDEX idx_article_likes_article_id ON content.article_likes(article_id);
