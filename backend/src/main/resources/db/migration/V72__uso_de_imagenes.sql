-- Uso de cada imagen (decisión del dueño 2026-10-21): las creatividades y
-- logos de publicidad se mezclaban con las fotos de contenido en la
-- biblioteca de los compositores. Lo que ya usa publicidad pasa a 'AD'.
ALTER TABLE media.images
    ADD COLUMN purpose TEXT NOT NULL DEFAULT 'CONTENT',
    ADD CONSTRAINT ck_images_purpose CHECK (purpose IN ('CONTENT', 'AD'));

UPDATE media.images
SET purpose = 'AD'
WHERE id IN (SELECT image_id FROM advertising.campaigns WHERE image_id IS NOT NULL
             UNION
             SELECT logo_image_id FROM advertising.advertisers WHERE logo_image_id IS NOT NULL);

CREATE INDEX ix_images_purpose_created_at ON media.images (purpose, created_at DESC);
