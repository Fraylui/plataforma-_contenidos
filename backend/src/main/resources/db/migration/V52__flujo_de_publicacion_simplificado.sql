-- Flujo de plataforma (spec 2026-10-07 §1): Borrador → Pendiente de aprobación
-- → Programado → Publicado → Archivado. Se retiran APPROVED y REJECTED (pasos
-- de redacción) y la nota de devolución pasa a llamarse review_note.
--   APPROVED → DRAFT (quien publica lo publica o programa desde el borrador).
--   REJECTED → DRAFT conservando la nota para quien lo creó.
-- Las 5 tablas de contenido comparten la misma máquina de estados
-- (shared.publishing.PublishableContent).

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['content.articles', 'places.places', 'events.events', 'galleries.galleries',
                             'directory.businesses']
    LOOP
        EXECUTE format('ALTER TABLE %s RENAME COLUMN rejection_reason TO review_note', t);
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', t, split_part(t, '.', 2) || '_status_check');
        EXECUTE format('UPDATE %s SET status = ''DRAFT'' WHERE status IN (''APPROVED'', ''REJECTED'')', t);
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I CHECK (status IN '
                       '(''DRAFT'', ''IN_REVIEW'', ''SCHEDULED'', ''PUBLISHED'', ''ARCHIVED''))',
                       t, split_part(t, '.', 2) || '_status_check');
    END LOOP;
END $$;
