-- Portada fija por serie (arte del programa), elegida de la biblioteca de
-- imágenes. Sin portada, el sitio usa la miniatura del último episodio.
-- UUID sin FK cross-schema (Media), igual que el resto del contenido.
ALTER TABLE series.series ADD COLUMN cover_image_id UUID;
