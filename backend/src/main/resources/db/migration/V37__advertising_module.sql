-- Módulo de Publicidad (CONTEXTO.md sección 43.2): "la arquitectura frontend
-- debe soportar distintas posiciones de anuncio mediante slots configurables,
-- sin editar manualmente cada página". Hasta ahora solo existían dos columnas
-- fijas (adsense_slot_article/listing) en configuration.platform_settings —
-- agregar una posición nueva exigía una migración + código. Esta tabla saca
-- los slots de esa fila singleton a un módulo propio (sección 19: "Advertising"
-- ya está listado como módulo separado) para que el admin pueda crear/activar/
-- desactivar posiciones desde el panel sin tocar código.
CREATE SCHEMA IF NOT EXISTS advertising;

CREATE TABLE advertising.ad_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    adsense_slot_id TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migra los dos slots que ya existían como columnas fijas, conservando el
-- valor que el admin ya haya cargado (o NULL si todavía no lo completó).
INSERT INTO advertising.ad_placements (key, label, adsense_slot_id)
SELECT 'article', 'Detalle de contenido', adsense_slot_article FROM configuration.platform_settings;

INSERT INTO advertising.ad_placements (key, label, adsense_slot_id)
SELECT 'listing', 'Listados', adsense_slot_listing FROM configuration.platform_settings;

ALTER TABLE configuration.platform_settings
    DROP COLUMN adsense_slot_article,
    DROP COLUMN adsense_slot_listing;
