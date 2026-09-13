-- Generaliza Lugares al mismo modelo que Publicaciones (V31): cada imagen
-- puede ser subida (image_id) o un enlace externo (external_url), y varios
-- videos de YouTube en vez de uno solo.
ALTER TABLE places.place_images ADD COLUMN external_url TEXT;
ALTER TABLE places.place_images DROP CONSTRAINT place_images_pkey;
ALTER TABLE places.place_images ALTER COLUMN image_id DROP NOT NULL;
ALTER TABLE places.place_images ADD PRIMARY KEY (place_id, sort_order);
ALTER TABLE places.place_images ADD CONSTRAINT place_images_one_source CHECK (
    (image_id IS NOT NULL AND external_url IS NULL) OR (image_id IS NULL AND external_url IS NOT NULL)
);

CREATE TABLE places.place_videos (
    place_id   UUID NOT NULL REFERENCES places.places (id) ON DELETE CASCADE,
    video_id   TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (place_id, sort_order)
);

INSERT INTO places.place_videos (place_id, video_id, sort_order)
SELECT id, youtube_video_id, 0 FROM places.places WHERE youtube_video_id IS NOT NULL;

ALTER TABLE places.places DROP COLUMN youtube_video_id;
