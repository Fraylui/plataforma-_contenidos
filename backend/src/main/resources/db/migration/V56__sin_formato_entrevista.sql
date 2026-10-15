-- Decisión del dueño (2026-10-15): "nada de periodismo". Se retira el formato
-- Entrevista; lo que lo usaba pasa a General (el contenido no cambia).
UPDATE content.articles SET article_type = 'GENERAL' WHERE article_type = 'ENTREVISTA';
ALTER TABLE content.articles DROP CONSTRAINT articles_article_type_check;
ALTER TABLE content.articles ADD CONSTRAINT articles_article_type_check CHECK (article_type IN (
    'GENERAL', 'GUIA', 'LISTA', 'TUTORIAL', 'HISTORIA'
));
