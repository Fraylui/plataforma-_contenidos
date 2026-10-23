-- Visitas anónimas por día y contenido (hoja de ruta F3). Sin cookies, sin
-- IP ni identificadores: solo el total del día. Las visitas se suman en Redis
-- y una tarea las vuelca aquí cada minuto (engagement.ContentViewFlushJob).
-- Mismo criterio que content_likes: content_id sin FK cross-schema.
CREATE TABLE engagement.content_views_daily (
    day DATE NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    content_id UUID NOT NULL,
    views BIGINT NOT NULL CHECK (views >= 0),
    PRIMARY KEY (day, content_type, content_id)
);

-- "Lo más visto" de un contenido o un tipo dentro de un rango de días.
CREATE INDEX idx_content_views_daily_content ON engagement.content_views_daily(content_type, content_id);
