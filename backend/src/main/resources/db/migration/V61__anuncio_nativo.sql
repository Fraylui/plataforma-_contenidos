-- Anuncio nativo del feed (spec 2026-10-16): además del banner, una campaña
-- puede ser un post como los de Instagram/Facebook — logo y nombre del
-- anunciante, texto, foto o video de YouTube y un botón de acción de una
-- lista cerrada. Solo va en la posición del feed (lo valida CampaignService).
-- El video vive en el YouTube del anunciante: aquí solo se guarda su id.

ALTER TABLE advertising.advertisers
    ADD COLUMN logo_image_id UUID;

ALTER TABLE advertising.campaigns
    ADD COLUMN format           TEXT NOT NULL DEFAULT 'BANNER',
    ADD COLUMN primary_text     TEXT,
    ADD COLUMN headline         TEXT,
    ADD COLUMN call_to_action   TEXT,
    ADD COLUMN youtube_video_id TEXT,
    -- Proporción del medio ('1:1', '4:5', '1.91:1', '16:9', '9:16'): el sitio reserva el alto exacto, sin saltos.
    ADD COLUMN media_aspect     TEXT,
    ADD COLUMN play_count       BIGINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT ck_campaigns_format CHECK (format IN ('BANNER', 'NATIVE')),
    ADD CONSTRAINT ck_campaigns_primary_text CHECK (char_length(primary_text) <= 500),
    ADD CONSTRAINT ck_campaigns_headline CHECK (char_length(headline) <= 60),
    ADD CONSTRAINT ck_campaigns_call_to_action CHECK (call_to_action IN
        ('LEARN_MORE', 'SHOP_NOW', 'BOOK', 'ORDER', 'WHATSAPP', 'SIGN_UP')),
    ADD CONSTRAINT ck_campaigns_youtube_video_id CHECK (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
    -- Nativo: texto + botón + exactamente un medio (foto subida o video).
    ADD CONSTRAINT ck_campaigns_native_shape CHECK (format = 'BANNER' OR (
        primary_text IS NOT NULL AND call_to_action IS NOT NULL AND media_aspect IS NOT NULL
        AND external_url IS NULL AND ((youtube_video_id IS NULL) <> (image_id IS NULL))));

-- Reproducciones (el visitante tocó play) para el reporte al anunciante.
ALTER TABLE advertising.campaign_daily_stats
    ADD COLUMN plays BIGINT NOT NULL DEFAULT 0;
