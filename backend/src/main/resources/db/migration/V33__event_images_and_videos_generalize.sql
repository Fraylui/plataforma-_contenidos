-- Generaliza Eventos al mismo modelo que Publicaciones/Lugares (V31/V32):
-- cada imagen puede ser subida (image_id) o un enlace externo
-- (external_url), y varios videos de YouTube en vez de uno solo.
ALTER TABLE events.event_images ADD COLUMN external_url TEXT;
ALTER TABLE events.event_images DROP CONSTRAINT event_images_pkey;
ALTER TABLE events.event_images ALTER COLUMN image_id DROP NOT NULL;
ALTER TABLE events.event_images ADD PRIMARY KEY (event_id, sort_order);
ALTER TABLE events.event_images ADD CONSTRAINT event_images_one_source CHECK (
    (image_id IS NOT NULL AND external_url IS NULL) OR (image_id IS NULL AND external_url IS NOT NULL)
);

CREATE TABLE events.event_videos (
    event_id   UUID NOT NULL REFERENCES events.events (id) ON DELETE CASCADE,
    video_id   TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, sort_order)
);

INSERT INTO events.event_videos (event_id, video_id, sort_order)
SELECT id, youtube_video_id, 0 FROM events.events WHERE youtube_video_id IS NOT NULL;

ALTER TABLE events.events DROP COLUMN youtube_video_id;
