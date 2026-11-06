-- País del lugar (ISO 3166-1 alfa-2, ej. PE, CL, ES). «Mis viajes» da un
-- sello por región dentro del Perú y uno por país fuera de él. Los lugares
-- que ya tenían región del Perú quedan con país PE.
ALTER TABLE places.places ADD COLUMN country VARCHAR(2);
UPDATE places.places SET country = 'PE' WHERE region IS NOT NULL;
ALTER TABLE places.places ADD CONSTRAINT places_country_iso CHECK (country IS NULL OR country ~ '^[A-Z]{2}$');
-- La región solo aplica a lugares del Perú.
ALTER TABLE places.places ADD CONSTRAINT places_region_only_peru CHECK (region IS NULL OR country = 'PE');
