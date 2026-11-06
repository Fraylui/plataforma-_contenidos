-- Decisión del dueño (2026-10-15): plataforma de contenidos al estilo de una
-- red social — el dueño y sus trabajadores publican directo. Se retira el paso
-- de aprobación heredado de las redacciones:
--   * nivel CREATE ("solo crear y enviar para aprobar") → PUBLISH;
--   * estado IN_REVIEW ("Pendiente de aprobación") → DRAFT;
--   * review_note (nota al devolver un contenido) deja de existir.

-- Permisos: quien tenía un módulo de contenido ahora publica en él.
UPDATE identity.worker_permissions SET level = 'PUBLISH' WHERE level = 'CREATE';
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_level_check;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_level_check
    CHECK (level IN ('PUBLISH', 'ACCESS'));
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_level_by_module;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_level_by_module CHECK (
    (module IN ('ARTICLES','PLACES','EVENTS','GALLERIES','DIRECTORY') AND level = 'PUBLISH')
    OR (module IN ('CATEGORIES','STATS','ADVERTISING') AND level = 'ACCESS'));

-- Contenido: lo que esperaba aprobación vuelve a borrador para que quien lo
-- creó lo publique.
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['content.articles', 'places.places', 'events.events', 'galleries.galleries',
                             'directory.businesses']
    LOOP
        EXECUTE format('UPDATE %s SET status = ''DRAFT'' WHERE status = ''IN_REVIEW''', t);
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', t, split_part(t, '.', 2) || '_status_check');
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I CHECK (status IN '
                       '(''DRAFT'', ''SCHEDULED'', ''PUBLISHED'', ''ARCHIVED''))',
                       t, split_part(t, '.', 2) || '_status_check');
        EXECUTE format('ALTER TABLE %s DROP COLUMN review_note', t);
    END LOOP;
END $$;
