-- Reseñas se da de baja como módulo propio: la reseña siempre la escribe el
-- propio editor de la plataforma (no hay cuentas de lectores), así que su
-- rasgo distintivo (rating de 1-5) es solo la opinión del editor, y como
-- módulo aparte duplicaba todo el flujo editorial de Publicación (borrador
-- →revisión→aprobación→publicación→programación→archivo) por casi ningún
-- campo extra. No se repliega en ArticleType (V27 ya sacó RESENA de ahí por
-- la razón inversa) — se elimina sin más.
DELETE FROM engagement.content_likes WHERE content_type = 'REVIEW';

DROP TABLE reviews.review_images;
DROP TABLE reviews.reviews;

DROP SCHEMA reviews CASCADE;
