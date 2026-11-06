-- Se quita el Directorio (dueño, 2026-10-17): las fichas de negocios con
-- teléfono, web y promociones funcionaban como publicidad gratis. Respaldo
-- previo fuera del repositorio (docs/respaldos/directorio-2026-10-17.sql).
-- Las fotos siguen en la biblioteca de Medios.
DROP SCHEMA directory CASCADE;

DELETE FROM engagement.content_likes WHERE content_type = 'BUSINESS';
DELETE FROM engagement.content_views_daily WHERE content_type = 'BUSINESS';
DELETE FROM identity.worker_permissions WHERE module = 'DIRECTORY';
UPDATE advertising.campaigns
   SET target_sections = array_remove(target_sections, 'BUSINESS')
 WHERE 'BUSINESS' = ANY (target_sections);

ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_module_check;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_module_check CHECK (module IN (
    'PUBLICATIONS', 'PLACES', 'CELEBRATIONS', 'GALLERIES', 'SERIES',
    'CATEGORIES', 'STATS', 'ADVERTISING', 'WORKERS', 'SETTINGS'));
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_level_by_module;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_level_by_module CHECK (
    (module IN ('PUBLICATIONS', 'PLACES', 'CELEBRATIONS', 'GALLERIES', 'SERIES') AND level = 'PUBLISH')
    OR (module IN ('CATEGORIES', 'STATS', 'ADVERTISING', 'WORKERS', 'SETTINGS') AND level = 'ACCESS'));
