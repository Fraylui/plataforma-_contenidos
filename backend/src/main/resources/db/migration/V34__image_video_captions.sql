-- Título y pie de foto opcionales por imagen y por video, en los tres tipos
-- de contenido que comparten ContentImage/ContentVideo (Publicaciones,
-- Lugares, Eventos). El título del video se autorrellena en el frontend vía
-- oEmbed de YouTube al pegar el link, editable a mano.

ALTER TABLE content.article_images ADD COLUMN title VARCHAR(200);
ALTER TABLE content.article_images ADD COLUMN caption VARCHAR(500);
ALTER TABLE content.article_videos ADD COLUMN title VARCHAR(200);
ALTER TABLE content.article_videos ADD COLUMN caption VARCHAR(500);

ALTER TABLE places.place_images ADD COLUMN title VARCHAR(200);
ALTER TABLE places.place_images ADD COLUMN caption VARCHAR(500);
ALTER TABLE places.place_videos ADD COLUMN title VARCHAR(200);
ALTER TABLE places.place_videos ADD COLUMN caption VARCHAR(500);

ALTER TABLE events.event_images ADD COLUMN title VARCHAR(200);
ALTER TABLE events.event_images ADD COLUMN caption VARCHAR(500);
ALTER TABLE events.event_videos ADD COLUMN title VARCHAR(200);
ALTER TABLE events.event_videos ADD COLUMN caption VARCHAR(500);
