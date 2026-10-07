-- Publicidad directa con criterio profesional (CONTEXTO §30):
--
-- 1. Medida fija por posición (tamaños estándar IAB). Antes cada espacio
--    tenía otra proporción definida en el CSS y la creatividad se recortaba
--    con object-cover: un banner con texto quedaba mutilado. Ahora el
--    anunciante diseña para la medida de la posición y se muestra entera.
ALTER TABLE advertising.ad_placements
    ADD COLUMN width  INTEGER NOT NULL DEFAULT 300,
    ADD COLUMN height INTEGER NOT NULL DEFAULT 250,
    ADD CONSTRAINT ck_ad_placements_size CHECK (width BETWEEN 50 AND 2000 AND height BETWEEN 50 AND 2000);

UPDATE advertising.ad_placements SET width = 728, height = 90 WHERE key = 'cabecera';
UPDATE advertising.ad_placements SET width = 320, height = 50 WHERE key = 'anchor';

-- 2. Peso de rotación: con varias campañas en la misma posición, la que
--    tiene más peso sale más seguido (selección ponderada), sin dejar a las
--    demás sin aparecer.
ALTER TABLE advertising.campaigns
    ADD COLUMN weight INTEGER NOT NULL DEFAULT 5,
    ADD CONSTRAINT ck_campaigns_weight CHECK (weight BETWEEN 1 AND 10);

-- 3. Impresiones visibles y clics por día, para el reporte al anunciante.
--    Los totales de campaigns.*_count se mantienen (lectura barata en listas).
CREATE TABLE advertising.campaign_daily_stats (
    campaign_id UUID   NOT NULL REFERENCES advertising.campaigns (id) ON DELETE CASCADE,
    day         DATE   NOT NULL,
    impressions BIGINT NOT NULL DEFAULT 0,
    clicks      BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (campaign_id, day)
);
