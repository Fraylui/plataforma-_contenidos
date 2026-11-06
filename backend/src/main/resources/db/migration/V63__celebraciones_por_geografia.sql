-- Celebraciones por geografía (aprobado por el dueño 2026-10-16), como los
-- Doodles de Google: cada celebración es mundial, de un país o de una región
-- de ese país, y «Hoy se celebra» muestra solo lo del lugar del visitante
-- (cabeceras de Cloudflare). El archivo /celebraciones sigue mostrando todo.
ALTER TABLE events.events
    -- ISO 3166-1 alfa-2 en mayúsculas ('PE'); null = en todo el mundo.
    ADD COLUMN scope_country VARCHAR(2),
    -- Región como la escribe el panel ('Ayacucho'); se compara normalizada (RegionNames).
    ADD COLUMN scope_region  VARCHAR(100),
    ADD CONSTRAINT ck_events_scope_country CHECK (scope_country IS NULL OR scope_country ~ '^[A-Z]{2}$'),
    ADD CONSTRAINT ck_events_scope_region CHECK (scope_region IS NULL OR scope_country IS NOT NULL);

-- País del sitio: qué se muestra cuando no se sabe dónde está el visitante
-- (VPN, sin Cloudflare): lo mundial y lo de este país, sin regiones.
ALTER TABLE configuration.platform_settings
    ADD COLUMN home_country VARCHAR(2) NOT NULL DEFAULT 'PE',
    ADD CONSTRAINT ck_platform_settings_home_country CHECK (home_country ~ '^[A-Z]{2}$');
