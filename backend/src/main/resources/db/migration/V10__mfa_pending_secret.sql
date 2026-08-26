-- Permite rotar el secreto TOTP de una cuenta que ya tiene MFA habilitado
-- sin deshabilitar la protección mientras el nuevo secreto no se confirma
-- (ver MfaService.startEnrollment/confirmEnrollment). Antes, re-enrolar
-- reemplazaba secret_encrypted de inmediato y ponía enabled=false, dejando
-- la cuenta sin MFA si el usuario abandonaba el flujo antes de confirmar.
ALTER TABLE identity.mfa_totp ADD COLUMN pending_secret_encrypted TEXT;
