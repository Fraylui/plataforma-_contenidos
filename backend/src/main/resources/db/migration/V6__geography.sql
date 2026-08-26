CREATE SCHEMA IF NOT EXISTS geography;

CREATE TABLE geography.units (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    level       TEXT NOT NULL CHECK (level IN ('PAIS', 'REGION', 'PROVINCIA', 'DISTRITO', 'LOCALIDAD')),
    parent_id   UUID REFERENCES geography.units (id),
    active      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_geography_units_parent_id ON geography.units (parent_id);
CREATE INDEX ix_geography_units_level ON geography.units (level);
