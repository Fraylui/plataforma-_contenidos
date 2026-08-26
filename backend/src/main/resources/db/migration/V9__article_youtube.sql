-- CONTEXTO.md sección 8: solo se guarda la referencia (Video ID), nunca el
-- video en sí. Opcional: no todo artículo tiene video.
ALTER TABLE content.articles ADD COLUMN youtube_video_id TEXT;
