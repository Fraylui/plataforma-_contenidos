CREATE SCHEMA IF NOT EXISTS taxonomy;

CREATE TABLE taxonomy.categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT,
    parent_id       UUID REFERENCES taxonomy.categories (id),
    active          BOOLEAN NOT NULL DEFAULT true,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_categories_parent_id ON taxonomy.categories (parent_id);
CREATE INDEX ix_categories_active ON taxonomy.categories (active);

CREATE TABLE taxonomy.tags (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    slug    TEXT NOT NULL UNIQUE
);
