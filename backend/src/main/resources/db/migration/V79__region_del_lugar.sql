-- Región del Perú de cada lugar (opcional): alimenta los sellos del
-- Pasaporte del público. Valores de PeruRegion.
ALTER TABLE places.places ADD COLUMN region VARCHAR(20);
