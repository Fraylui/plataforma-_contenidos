-- Formatos de plataforma de contenido en vez de géneros periodísticos
-- (decisión del dueño, 2026-10-06: "esto no es periodismo, no es editorial").
-- Nada se pierde: cada publicación pasa al formato más cercano.
--   ARTICULO, NOTICIA, OPINION -> GENERAL
--   REPORTAJE, CRONICA         -> HISTORIA
--   RANKING                    -> LISTA

ALTER TABLE content.articles DROP CONSTRAINT articles_article_type_check;

UPDATE content.articles SET article_type = 'GENERAL'  WHERE article_type IN ('ARTICULO', 'NOTICIA', 'OPINION');
UPDATE content.articles SET article_type = 'HISTORIA' WHERE article_type IN ('REPORTAJE', 'CRONICA');
UPDATE content.articles SET article_type = 'LISTA'    WHERE article_type = 'RANKING';

ALTER TABLE content.articles ADD CONSTRAINT articles_article_type_check CHECK (article_type IN (
    'GENERAL', 'GUIA', 'LISTA', 'TUTORIAL', 'HISTORIA', 'ENTREVISTA'
));
