-- Directorio pasa al mismo patrón ContentImage/ContentVideo que ya usan
-- Article/Place/Event/Gallery: fotos por subida o enlace externo con
-- título/pie de foto, y varios videos de YouTube en vez de uno solo. Mismo
-- criterio que V42__galleries_content_images.sql y
-- V31__article_images_and_videos.sql + V34__image_video_captions.sql.
CREATE TABLE directory.business_images_new (
    business_id  UUID NOT NULL REFERENCES directory.businesses (id) ON DELETE CASCADE,
    image_id     UUID,
    external_url TEXT,
    title        VARCHAR(200),
    caption      VARCHAR(500),
    sort_order   INT NOT NULL DEFAULT 0,
    PRIMARY KEY (business_id, sort_order),
    CONSTRAINT business_images_one_source CHECK (
        (image_id IS NOT NULL AND external_url IS NULL) OR (image_id IS NULL AND external_url IS NOT NULL)
    )
);

INSERT INTO directory.business_images_new (business_id, image_id, sort_order)
SELECT business_id, image_id, sort_order FROM directory.business_images;

DROP TABLE directory.business_images;

ALTER TABLE directory.business_images_new RENAME TO business_images;

CREATE TABLE directory.business_videos (
    business_id UUID NOT NULL REFERENCES directory.businesses (id) ON DELETE CASCADE,
    video_id    TEXT NOT NULL,
    title       VARCHAR(200),
    caption     VARCHAR(500),
    sort_order  INT NOT NULL DEFAULT 0,
    PRIMARY KEY (business_id, sort_order)
);

INSERT INTO directory.business_videos (business_id, video_id, sort_order)
SELECT id, youtube_video_id, 0 FROM directory.businesses WHERE youtube_video_id IS NOT NULL;

ALTER TABLE directory.businesses DROP COLUMN youtube_video_id;
