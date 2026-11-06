-- Reacciones expresivas (2026-11): además del «me gusta», el lector anónimo
-- puede reaccionar con un emoji (me encanta, me divierte, me sorprende, me
-- inspira). Una sola reacción por visitante y contenido: se cambia o se
-- quita. Sin cuentas ni datos personales: visitor_id es el mismo id anónimo
-- del navegador que usan los «me gusta» (content_likes).
CREATE TABLE engagement.content_reactions (
    content_type  TEXT NOT NULL,
    content_id    UUID NOT NULL,
    visitor_id    UUID NOT NULL,
    reaction      TEXT NOT NULL CHECK (reaction IN ('LOVE', 'FUNNY', 'WOW', 'INSPIRED')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (content_type, content_id, visitor_id)
);
