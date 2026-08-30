-- "RESENA" como articleType duplicaba, con mucho menos campos, al módulo
-- separado Reviews (placeId/subjectName/rating, V20__reviews.sql). Una
-- reseña real vive ahí; este tipo de Artículo se elimina para no tener dos
-- conceptos distintos con el mismo nombre en el sistema.

ALTER TABLE content.articles DROP CONSTRAINT articles_article_type_check;

ALTER TABLE content.articles ADD CONSTRAINT articles_article_type_check CHECK (article_type IN (
    'ARTICULO', 'NOTICIA', 'REPORTAJE', 'CRONICA', 'GUIA',
    'ENTREVISTA', 'HISTORIA', 'RANKING', 'TUTORIAL', 'OPINION'
));
