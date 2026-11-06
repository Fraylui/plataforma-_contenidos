-- Proyecto 2a: trabajadores con módulos asignados (spec
-- docs/superpowers/specs/2026-10-06-trabajadores-y-permisos-design.md).
-- Sin fila = sin acceso; el dueño no tiene filas (puede todo).

CREATE TABLE identity.worker_permissions (
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    module  TEXT NOT NULL CHECK (module IN ('ARTICLES','PLACES','EVENTS','GALLERIES','DIRECTORY','CATEGORIES','STATS','ADVERTISING')),
    level   TEXT NOT NULL CHECK (level IN ('CREATE','PUBLISH','ACCESS')),
    PRIMARY KEY (user_id, module),
    -- Contenido usa CREATE/PUBLISH; temas, estadísticas y publicidad usan ACCESS.
    CONSTRAINT worker_permissions_level_by_module CHECK (
        (module IN ('ARTICLES','PLACES','EVENTS','GALLERIES','DIRECTORY') AND level IN ('CREATE','PUBLISH'))
        OR (module IN ('CATEGORIES','STATS','ADVERTISING') AND level = 'ACCESS'))
);

-- Contraseña temporal pendiente de cambio.
ALTER TABLE identity.users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false;

-- Detalle de eventos de auditoría (p. ej. permisos antes → después).
ALTER TABLE audit.audit_log ADD COLUMN details TEXT;

-- Las cuentas existentes conservan lo que podían hacer con su rol:
--   ADMIN  -> Publicador + Publicidad
--   EDITOR -> Publicador
--   AUTHOR -> Creador
INSERT INTO identity.worker_permissions (user_id, module, level)
SELECT u.id, m.module, 'PUBLISH'
FROM identity.users u
CROSS JOIN (VALUES ('ARTICLES'), ('PLACES'), ('EVENTS'), ('GALLERIES'), ('DIRECTORY')) AS m(module)
WHERE u.role IN ('ADMIN', 'EDITOR');

INSERT INTO identity.worker_permissions (user_id, module, level)
SELECT u.id, m.module, 'ACCESS'
FROM identity.users u
CROSS JOIN (VALUES ('CATEGORIES'), ('STATS')) AS m(module)
WHERE u.role IN ('ADMIN', 'EDITOR');

INSERT INTO identity.worker_permissions (user_id, module, level)
SELECT u.id, 'ADVERTISING', 'ACCESS' FROM identity.users u WHERE u.role = 'ADMIN';

INSERT INTO identity.worker_permissions (user_id, module, level)
SELECT u.id, m.module, 'CREATE'
FROM identity.users u
CROSS JOIN (VALUES ('ARTICLES'), ('PLACES'), ('EVENTS'), ('GALLERIES'), ('DIRECTORY')) AS m(module)
WHERE u.role = 'AUTHOR';
