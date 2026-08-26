CREATE SCHEMA IF NOT EXISTS media;

CREATE TABLE media.images (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename   TEXT NOT NULL,
    stored_filename     TEXT NOT NULL UNIQUE,
    content_type        TEXT NOT NULL,
    size_bytes          BIGINT NOT NULL,
    width               INT NOT NULL,
    height              INT NOT NULL,
    alt_text            TEXT,
    uploaded_by         UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_images_uploaded_by ON media.images (uploaded_by);
