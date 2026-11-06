-- «Evento» pasa a llamarse «Celebración» también en el código y la base
-- (spec 2026-10-16: modelo Google Doodles; en pantalla ya se llamaba
-- Celebraciones). Mismos datos, solo cambian los nombres. Las filas de
-- auditoría EVENT_* se dejan como están (registro inmutable, ISO 27001
-- A.8.15); el panel las sigue mostrando como «celebración».

ALTER SCHEMA events RENAME TO celebrations;

ALTER TABLE celebrations.events RENAME TO celebrations;
ALTER TABLE celebrations.event_images RENAME TO celebration_images;
ALTER TABLE celebrations.event_videos RENAME TO celebration_videos;

ALTER TABLE celebrations.celebration_images RENAME COLUMN event_id TO celebration_id;
ALTER TABLE celebrations.celebration_videos RENAME COLUMN event_id TO celebration_id;

-- Restricciones (las de clave primaria y unique renombran también su índice).
ALTER TABLE celebrations.celebrations RENAME CONSTRAINT events_pkey TO celebrations_pkey;
ALTER TABLE celebrations.celebrations RENAME CONSTRAINT events_slug_key TO celebrations_slug_key;
ALTER TABLE celebrations.celebrations RENAME CONSTRAINT events_status_check TO celebrations_status_check;
ALTER TABLE celebrations.celebrations RENAME CONSTRAINT events_ends_after_starts TO celebrations_ends_after_starts;
ALTER TABLE celebrations.celebrations RENAME CONSTRAINT ck_events_since_year TO ck_celebrations_since_year;
ALTER TABLE celebrations.celebrations RENAME CONSTRAINT ck_events_scope_country TO ck_celebrations_scope_country;
ALTER TABLE celebrations.celebrations RENAME CONSTRAINT ck_events_scope_region TO ck_celebrations_scope_region;
ALTER TABLE celebrations.celebration_images RENAME CONSTRAINT event_images_pkey TO celebration_images_pkey;
ALTER TABLE celebrations.celebration_images RENAME CONSTRAINT event_images_one_source TO celebration_images_one_source;
ALTER TABLE celebrations.celebration_images RENAME CONSTRAINT event_images_event_id_fkey TO celebration_images_celebration_id_fkey;
ALTER TABLE celebrations.celebration_videos RENAME CONSTRAINT event_videos_pkey TO celebration_videos_pkey;
ALTER TABLE celebrations.celebration_videos RENAME CONSTRAINT event_videos_event_id_fkey TO celebration_videos_celebration_id_fkey;

ALTER INDEX celebrations.ix_events_status RENAME TO ix_celebrations_status;
ALTER INDEX celebrations.ix_events_author_id RENAME TO ix_celebrations_author_id;
ALTER INDEX celebrations.ix_events_category_id RENAME TO ix_celebrations_category_id;
ALTER INDEX celebrations.ix_events_place_id RENAME TO ix_celebrations_place_id;
ALTER INDEX celebrations.ix_events_status_starts_at RENAME TO ix_celebrations_status_starts_at;
ALTER INDEX celebrations.ix_events_status_scheduled_at RENAME TO ix_celebrations_status_scheduled_at;
ALTER INDEX celebrations.ix_events_status_next_occurrence RENAME TO ix_celebrations_status_next_occurrence;
ALTER INDEX celebrations.ix_events_search_vector RENAME TO ix_celebrations_search_vector;

-- Valores guardados: tipo de contenido (me gusta, visitas), sección de anuncios y módulo de permisos.
UPDATE engagement.content_likes SET content_type = 'CELEBRATION' WHERE content_type = 'EVENT';
UPDATE engagement.content_views_daily SET content_type = 'CELEBRATION' WHERE content_type = 'EVENT';
UPDATE advertising.campaigns SET target_sections = array_replace(target_sections, 'EVENT', 'CELEBRATION')
 WHERE 'EVENT' = ANY (target_sections);

ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_module_check;
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_level_by_module;
UPDATE identity.worker_permissions SET module = 'CELEBRATIONS' WHERE module = 'EVENTS';
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_module_check CHECK (module IN (
    'PUBLICATIONS','PLACES','CELEBRATIONS','GALLERIES','DIRECTORY','SERIES','CATEGORIES','STATS','ADVERTISING','WORKERS','SETTINGS'));
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_level_by_module CHECK (
    (module IN ('PUBLICATIONS','PLACES','CELEBRATIONS','GALLERIES','DIRECTORY','SERIES') AND level = 'PUBLISH')
    OR (module IN ('CATEGORIES','STATS','ADVERTISING','WORKERS','SETTINGS') AND level = 'ACCESS'));
