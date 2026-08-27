-- Foto destacada para tarjetas/portada (sección 43: las tarjetas de
-- artículo no tenían ninguna imagen, a diferencia de Lugares). UUID sin FK
-- — mismo criterio que category_id/geography_id (pertenece al módulo
-- Media, sección 38, sin joins cruzados de esquema). Opcional: no todo
-- artículo tiene una imagen subida todavía.
ALTER TABLE content.articles ADD COLUMN featured_image_id UUID;
