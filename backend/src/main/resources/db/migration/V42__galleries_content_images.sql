-- Galería pasa al mismo patrón ContentImage que Article/Place/Event (subida
-- o enlace externo, con título/pie de foto por imagen) — hasta ahora era el
-- único tipo de contenido que no podía describir sus propias fotos, pese a
-- que su contenido ES la colección de fotos. Mismo criterio que
-- V31__article_images_and_videos.sql + V34__image_video_captions.sql.
CREATE TABLE galleries.gallery_images_new (
    gallery_id   UUID NOT NULL REFERENCES galleries.galleries (id) ON DELETE CASCADE,
    image_id     UUID,
    external_url TEXT,
    title        VARCHAR(200),
    caption      VARCHAR(500),
    sort_order   INT NOT NULL DEFAULT 0,
    PRIMARY KEY (gallery_id, sort_order),
    CONSTRAINT gallery_images_one_source CHECK (
        (image_id IS NOT NULL AND external_url IS NULL) OR (image_id IS NULL AND external_url IS NOT NULL)
    )
);

INSERT INTO galleries.gallery_images_new (gallery_id, image_id, sort_order)
SELECT gallery_id, image_id, sort_order FROM galleries.gallery_images;

DROP TABLE galleries.gallery_images;

ALTER TABLE galleries.gallery_images_new RENAME TO gallery_images;
