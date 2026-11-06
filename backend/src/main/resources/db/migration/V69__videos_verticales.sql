-- Shorts de YouTube: se muestran verticales (9:16) en el detalle (2026-10-16).
-- Solo se guarda el Video ID, así que el formato se recuerda aparte; los
-- videos ya cargados quedan horizontales hasta que se vuelvan a guardar.
ALTER TABLE content.publication_videos ADD COLUMN vertical BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE places.place_videos ADD COLUMN vertical BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE celebrations.celebration_videos ADD COLUMN vertical BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE directory.business_videos ADD COLUMN vertical BOOLEAN NOT NULL DEFAULT false;
