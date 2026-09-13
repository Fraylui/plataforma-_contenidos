-- Publicaciones ahora soportan varias imágenes (antes solo una portada,
-- featured_image_id) y varios videos de YouTube (antes uno solo) — mismo
-- criterio que Lugares/Eventos, generalizado a los 3 tipos de contenido de
-- texto/mixto (CONTEXTO.md sección 3): cada imagen puede ser subida
-- (image_id, módulo Media) o un enlace externo (external_url), nunca
-- ambas ni ninguna. La portada de tarjeta/feed pasa a ser "la primera
-- imagen de la lista" (mismo criterio que Lugares/Eventos ya usaban).
CREATE TABLE content.article_images (
    article_id   UUID NOT NULL REFERENCES content.articles (id) ON DELETE CASCADE,
    image_id     UUID,
    external_url TEXT,
    sort_order   INT NOT NULL DEFAULT 0,
    PRIMARY KEY (article_id, sort_order),
    CONSTRAINT article_images_one_source CHECK (
        (image_id IS NOT NULL AND external_url IS NULL) OR (image_id IS NULL AND external_url IS NOT NULL)
    )
);

INSERT INTO content.article_images (article_id, image_id, sort_order)
SELECT id, featured_image_id, 0 FROM content.articles WHERE featured_image_id IS NOT NULL;

ALTER TABLE content.articles DROP COLUMN featured_image_id;

CREATE TABLE content.article_videos (
    article_id UUID NOT NULL REFERENCES content.articles (id) ON DELETE CASCADE,
    video_id   TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (article_id, sort_order)
);

INSERT INTO content.article_videos (article_id, video_id, sort_order)
SELECT id, youtube_video_id, 0 FROM content.articles WHERE youtube_video_id IS NOT NULL;

ALTER TABLE content.articles DROP COLUMN youtube_video_id;
