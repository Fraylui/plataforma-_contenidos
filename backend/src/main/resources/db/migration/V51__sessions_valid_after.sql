-- Revisión final de 2a: sesiones emitidas antes de un cambio o
-- restablecimiento de contraseña, o de una desactivación, ya no valen
-- (incluidas las anteriores al índice por usuario de Redis).
ALTER TABLE identity.users ADD COLUMN sessions_valid_after TIMESTAMPTZ;
