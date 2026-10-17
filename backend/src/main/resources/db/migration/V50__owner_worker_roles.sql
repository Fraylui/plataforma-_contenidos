-- Proyecto 2a: los roles quedan en dueño y trabajador. Lo que puede hacer
-- cada trabajador vive en identity.worker_permissions (V49, que ya sembró
-- el alcance de ADMIN, EDITOR y AUTHOR).
ALTER TABLE identity.users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE identity.users SET role = 'OWNER' WHERE role = 'SUPER_ADMIN';
UPDATE identity.users SET role = 'WORKER' WHERE role <> 'OWNER';

ALTER TABLE identity.users ADD CONSTRAINT users_role_check CHECK (role IN ('OWNER', 'WORKER'));
