-- Separa el nombre de usuario en nombres/apellidos (antes un único
-- display_name libre) — dato real de identidad, no solo un apodo para
-- mostrar en el panel. Backfill best-effort desde display_name para no
-- perder datos de entornos ya sembrados; en producción todavía no hay
-- usuarios reales (proyecto pre-lanzamiento).

ALTER TABLE identity.users ADD COLUMN first_name TEXT;
ALTER TABLE identity.users ADD COLUMN last_name TEXT;

UPDATE identity.users
SET first_name = split_part(display_name, ' ', 1),
    last_name = NULLIF(trim(substring(display_name FROM position(' ' IN display_name) + 1)), '');

UPDATE identity.users SET first_name = 'Sin nombre' WHERE first_name IS NULL OR first_name = '';
UPDATE identity.users SET last_name = 'Sin apellido' WHERE last_name IS NULL OR last_name = '';

ALTER TABLE identity.users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE identity.users ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE identity.users DROP COLUMN display_name;
