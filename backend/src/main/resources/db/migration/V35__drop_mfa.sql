-- Se retira el 2FA/TOTP (decisión del producto, no un downgrade de
-- seguridad silencioso): quedará para una versión futura. Las tablas creadas
-- en V3/V10 quedan huérfanas del lado del código desde este commit — se
-- eliminan acá en vez de dejarlas vivas con secretos cifrados y hashes de
-- backup codes sin dueño.
DROP TABLE IF EXISTS identity.mfa_backup_codes;
DROP TABLE IF EXISTS identity.mfa_totp;
