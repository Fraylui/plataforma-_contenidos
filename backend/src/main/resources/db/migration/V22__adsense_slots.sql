-- Slots de anuncio configurables (CONTEXTO.md sección 43.2): permiten
-- posicionar AdSense en el detalle de contenido y en los listados sin
-- editar código. Nulos hasta que el admin los complete — el frontend no
-- renderiza el <ins> si el slot está vacío (ver AdSlot.tsx).

ALTER TABLE configuration.platform_settings
    ADD COLUMN adsense_slot_article TEXT,
    ADD COLUMN adsense_slot_listing TEXT;
