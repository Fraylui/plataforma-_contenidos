-- La Agenda pasa a ser de Fechas (decisión del dueño 2026-10-16: los
-- eventos comerciales sonaban a publicidad gratis; lo comercial entra solo
-- como post patrocinado). Una Fecha se repite cada año (28 de julio,
-- Batalla de Ayacucho, Canción Criolla) o es única (un eclipse). La tabla
-- sigue siendo events.events: mismo flujo de publicación, fotos, videos,
-- temas, buscador y feed.
ALTER TABLE events.events
    ADD COLUMN recurs_yearly   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN all_day         BOOLEAN NOT NULL DEFAULT false,
    -- Año de origen («desde 1824»), solo en las que se repiten.
    ADD COLUMN since_year      INTEGER,
    -- Próxima vez que toca (en la zona del sitio): ordena «lo que viene» y
    -- arma «Hoy se celebra». Lo mantiene EventService al guardar y a diario.
    ADD COLUMN next_occurrence TIMESTAMPTZ,
    ADD CONSTRAINT ck_events_since_year CHECK (since_year IS NULL OR (recurs_yearly AND since_year BETWEEN 1 AND 9999));

UPDATE events.events SET next_occurrence = starts_at;
ALTER TABLE events.events ALTER COLUMN next_occurrence SET NOT NULL;

CREATE INDEX ix_events_status_next_occurrence ON events.events (status, next_occurrence);
