-- MFA (TOTP) para identity.users. Ver CONTEXTO.md sección 36.5: obligatorio
-- para SUPER_ADMIN, disponible para cualquier usuario.

CREATE TABLE identity.mfa_totp (
    user_id             UUID PRIMARY KEY REFERENCES identity.users (id) ON DELETE CASCADE,
    secret_encrypted    TEXT NOT NULL,
    enabled             BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at        TIMESTAMPTZ
);

CREATE TABLE identity.mfa_backup_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES identity.users (id) ON DELETE CASCADE,
    code_hash   TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at     TIMESTAMPTZ
);

CREATE INDEX ix_mfa_backup_codes_user_id ON identity.mfa_backup_codes (user_id);
