-- Un solo dueño (decisión del dueño 2026-10-15: 1 dueño, N trabajadores).
-- Hasta ahora lo aseguraba solo el código (IdentityBootstrap crea el dueño si
-- no existe y nada más crea cuentas OWNER); ahora también la base: como
-- máximo una fila con role = 'OWNER'.
CREATE UNIQUE INDEX ux_users_single_owner ON identity.users ((role)) WHERE role = 'OWNER';
