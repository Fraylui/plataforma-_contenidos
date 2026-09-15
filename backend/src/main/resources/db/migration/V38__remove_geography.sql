-- Geografía (País>Región>Provincia>Distrito>Localidad) se da de baja: nunca
-- se usó para filtrar/navegar el sitio público, solo era una etiqueta de
-- texto en el detalle de cada contenido — no justificaba el costo de
-- curarla a mano nivel por nivel. DROP COLUMN se lleva sus índices con ella
-- (Postgres los borra en cascada al borrar la columna que indexan).
ALTER TABLE content.articles DROP COLUMN geography_id;
ALTER TABLE places.places DROP COLUMN geography_id;
ALTER TABLE events.events DROP COLUMN geography_id;
ALTER TABLE galleries.galleries DROP COLUMN geography_id;
ALTER TABLE reviews.reviews DROP COLUMN geography_id;
ALTER TABLE directory.businesses DROP COLUMN geography_id;

DROP SCHEMA geography CASCADE;
