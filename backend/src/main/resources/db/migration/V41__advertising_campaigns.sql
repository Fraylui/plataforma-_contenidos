-- Publicidad directa (plan "Módulo de Publicidad directa"): hasta ahora
-- advertising.ad_placements solo define DÓNDE existe un slot de AdSense.
-- No había forma de vender un banner directo a una empresa/negocio local.
-- advertiser_id/placement_key son UUID/TEXT sin FK entre tablas de negocio
-- (mismo criterio que content.articles.category_id): se validan en
-- CampaignService, no a nivel de esquema.
CREATE TABLE advertising.advertisers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE advertising.campaigns (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id     UUID NOT NULL,
    placement_key     TEXT NOT NULL,
    -- creatividad: mismo patrón XOR que las columnas embebidas de ContentImage.
    image_id          UUID,
    external_url      TEXT,
    title             TEXT,
    caption           TEXT,
    link_url          TEXT NOT NULL,
    starts_at         TIMESTAMPTZ,
    ends_at           TIMESTAMPTZ,
    active            BOOLEAN NOT NULL DEFAULT true,
    impression_count  BIGINT NOT NULL DEFAULT 0,
    click_count       BIGINT NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_campaigns_advertiser_id ON advertising.campaigns (advertiser_id);
-- Resuelve "hay campaña activa para esta posición" en cada carga de página pública.
CREATE INDEX ix_campaigns_placement_key_active ON advertising.campaigns (placement_key, active);
