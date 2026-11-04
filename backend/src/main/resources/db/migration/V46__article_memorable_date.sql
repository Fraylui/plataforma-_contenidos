-- "Un día como hoy": fecha memorable opcional de un contenido (una
-- batalla, una fundación, el nacimiento de un personaje, una fiesta). Se
-- guarda día y mes por separado porque se repite cada año; el año es
-- opcional (muchas leyendas o tradiciones no tienen uno conocido).
-- INTEGER y no SMALLINT: Hibernate valida el esquema contra los Integer de
-- Article y rechaza int2 (rompía el arranque de toda la app).
ALTER TABLE content.articles
    ADD COLUMN memorable_month INTEGER,
    ADD COLUMN memorable_day INTEGER,
    ADD COLUMN memorable_year INTEGER,
    ADD CONSTRAINT articles_memorable_month_range CHECK (memorable_month BETWEEN 1 AND 12),
    ADD CONSTRAINT articles_memorable_day_range CHECK (memorable_day BETWEEN 1 AND 31),
    ADD CONSTRAINT articles_memorable_year_range CHECK (memorable_year BETWEEN 1 AND 9999),
    -- Día y mes van juntos; el año solo tiene sentido si hay día y mes.
    ADD CONSTRAINT articles_memorable_complete CHECK (
        (memorable_month IS NULL AND memorable_day IS NULL AND memorable_year IS NULL)
        OR (memorable_month IS NOT NULL AND memorable_day IS NOT NULL));

CREATE INDEX articles_memorable_month_day_idx
    ON content.articles (memorable_month, memorable_day)
    WHERE status = 'PUBLISHED' AND memorable_month IS NOT NULL;
