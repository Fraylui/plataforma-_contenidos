-- Enlaces de afiliado (2026-11): recomendaciones dentro de una publicación o
-- un lugar (un tour, un hotel, un libro) que pagan comisión si alguien compra.
-- Se muestran siempre marcados «Enlace de afiliado» (D.Leg. 1044, publicidad
-- no encubierta). Como stories, sin claves foráneas hacia otros módulos: el
-- servicio valida que el contenido exista y esté publicado.
CREATE SCHEMA IF NOT EXISTS affiliates;

CREATE TABLE affiliates.affiliate_links (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type  TEXT NOT NULL CHECK (content_type IN ('PUBLICATION', 'PLACE')),
    content_id    UUID NOT NULL,
    position      INTEGER NOT NULL CHECK (position BETWEEN 0 AND 9),
    label         TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
    url           TEXT NOT NULL CHECK (char_length(url) <= 2048 AND url ~ '^https://'),
    clicks        BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT affiliate_links_position_unique UNIQUE (content_type, content_id, position)
);
