-- "Me gusta" genérico para los 6 tipos de contenido (Artículo, Lugar, Evento,
-- Galería, Reseña, Directorio) — anónimo, deduplicado por visitor_id (UUID
-- generado y persistido en el navegador del lector). Una sola tabla en vez
-- de repetirla por módulo, igual que category_id/geography_id son UUID sin
-- FK cross-schema en el resto del sistema.
--
-- Reemplaza content.article_likes (V28), creada en esta misma sesión sin
-- datos reales que migrar.
DROP TABLE IF EXISTS content.article_likes;

CREATE SCHEMA IF NOT EXISTS engagement;

CREATE TABLE engagement.content_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL,
    content_id UUID NOT NULL,
    visitor_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (content_type, content_id, visitor_id)
);

CREATE INDEX idx_content_likes_content ON engagement.content_likes(content_type, content_id);
