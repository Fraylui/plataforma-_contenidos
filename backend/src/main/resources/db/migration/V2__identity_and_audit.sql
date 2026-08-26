-- Módulo Identity (CONTEXTO.md sección 38: cada módulo en su propio esquema)
CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE identity.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN (
                        'SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR',
                        'MODERATOR', 'COLLABORATOR', 'USER'
                    )),
    status          TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ
);

-- Unicidad case-insensitive sin depender de la extensión citext
CREATE UNIQUE INDEX ux_users_email_lower ON identity.users (lower(email));

-- Módulo Audit (append-only, ver AuditEvent/AuditEventRepository)
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_user_id   UUID,
    actor_email     TEXT,
    action          TEXT NOT NULL,
    resource_type   TEXT,
    resource_id     TEXT,
    ip_address      TEXT,
    result          TEXT NOT NULL CHECK (result IN ('SUCCESS', 'FAILURE'))
);

CREATE INDEX ix_audit_log_occurred_at ON audit.audit_log (occurred_at);
CREATE INDEX ix_audit_log_actor_user_id ON audit.audit_log (actor_user_id);
