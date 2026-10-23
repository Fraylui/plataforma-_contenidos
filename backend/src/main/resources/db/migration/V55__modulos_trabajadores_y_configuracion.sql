-- Administrador (pedido del dueño 2026-10-15): alguien que maneje la
-- plataforma cuando el dueño no está — contenido, trabajadores y
-- configuración — sin ver la auditoría. Trabajadores y Configuración dejan
-- de ser exclusivos del dueño y pasan a ser módulos asignables.
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_module_check;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_module_check CHECK (module IN (
    'ARTICLES','PLACES','EVENTS','GALLERIES','DIRECTORY','CATEGORIES','STATS','ADVERTISING','WORKERS','SETTINGS'));
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_level_by_module;
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_level_by_module CHECK (
    (module IN ('ARTICLES','PLACES','EVENTS','GALLERIES','DIRECTORY') AND level = 'PUBLISH')
    OR (module IN ('CATEGORIES','STATS','ADVERTISING','WORKERS','SETTINGS') AND level = 'ACCESS'));
