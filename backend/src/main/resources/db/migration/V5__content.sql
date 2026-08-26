-- Módulo Content. author_id y category_id son UUID sin FK: pertenecen a
-- Identity y Taxonomy respectivamente, y este esquema no referencia
-- directamente tablas de otros esquemas (CONTEXTO.md sección 38). La
-- integridad se valida en ArticleService.

CREATE SCHEMA IF NOT EXISTS content;

CREATE TABLE content.articles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                TEXT NOT NULL UNIQUE,
    title               TEXT NOT NULL,
    excerpt             TEXT,
    body                TEXT NOT NULL,
    article_type        TEXT NOT NULL CHECK (article_type IN (
                            'ARTICULO', 'NOTICIA', 'REPORTAJE', 'CRONICA', 'GUIA',
                            'ENTREVISTA', 'HISTORIA', 'RANKING', 'RESENA', 'TUTORIAL', 'OPINION'
                        )),
    status              TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
                            'DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'REJECTED'
                        )),
    author_id           UUID NOT NULL,
    category_id         UUID NOT NULL,
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

CREATE INDEX ix_articles_status ON content.articles (status);
CREATE INDEX ix_articles_author_id ON content.articles (author_id);
CREATE INDEX ix_articles_category_id ON content.articles (category_id);
CREATE INDEX ix_articles_status_published_at ON content.articles (status, published_at DESC);
CREATE INDEX ix_articles_status_scheduled_at ON content.articles (status, scheduled_at);

-- tag_id sin FK por el mismo motivo (pertenece a taxonomy.tags)
CREATE TABLE content.article_tags (
    article_id  UUID NOT NULL REFERENCES content.articles (id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL,
    PRIMARY KEY (article_id, tag_id)
);
