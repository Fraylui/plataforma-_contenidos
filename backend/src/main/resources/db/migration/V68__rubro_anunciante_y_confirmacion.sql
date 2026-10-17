-- Protecciones de publicidad pagada (2026-10-16).
-- Rubro del anunciante: alimentos procesados (Ley 30021), alcohol (Ley 28681)
-- y apuestas (Ley 31557) llevan advertencias obligatorias en el anuncio.
ALTER TABLE advertising.advertisers
    ADD COLUMN industry VARCHAR(32) NOT NULL DEFAULT 'GENERAL';

-- Cuándo el dueño confirmó que el anuncio muestra vigencia, stock y
-- condiciones de la oferta (D.L. 1044, art. 17.3.f). Null en campañas
-- anteriores a la regla; cada guardado nuevo la exige.
ALTER TABLE advertising.campaigns
    ADD COLUMN compliance_confirmed_at TIMESTAMPTZ;
