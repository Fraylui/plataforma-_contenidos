-- Segmentación por contexto de las campañas directas (CONTEXTO §45.4): con
-- muchas campañas pagadas, que todas se turnen en todos lados deja a cada
-- anunciante con muy pocas vistas. Cada dimensión vacía = sin restricción.
--
--  - target_sections: secciones del sitio donde sale (HOME, ARTICLE, PLACE,
--    EVENT, GALLERY, BUSINESS).
--  - target_category_ids: temas (incluye sus subtemas). Sin FK entre
--    esquemas, igual que category_id del contenido: lo valida CampaignService.
--  - target_countries / target_regions: ubicación del VISITANTE según
--    Cloudflare (cf-ipcountry, cf-region / cf-region-code). No depende de
--    ninguna geografía del contenido (ese módulo se dio de baja en V38).
ALTER TABLE advertising.campaigns
    ADD COLUMN target_sections     TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN target_category_ids UUID[] NOT NULL DEFAULT '{}',
    ADD COLUMN target_countries    TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN target_regions      TEXT[] NOT NULL DEFAULT '{}';
