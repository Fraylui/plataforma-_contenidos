-- «Artículo» pasa a llamarse «Publicación» también en el código y la base
-- (decisión del dueño: esto no es un medio editorial; en pantalla ya se
-- llamaba Publicaciones). Mismos datos, solo cambian los nombres.
-- Las filas de auditoría ARTICLE_* se dejan como están: el registro es
-- inmutable (ISO 27001 A.8.15); el panel las sigue mostrando como «publicación».

ALTER TABLE content.articles RENAME TO publications;
ALTER TABLE content.article_images RENAME TO publication_images;
ALTER TABLE content.article_videos RENAME TO publication_videos;

ALTER TABLE content.publications RENAME COLUMN article_type TO publication_type;
ALTER TABLE content.publication_images RENAME COLUMN article_id TO publication_id;
ALTER TABLE content.publication_videos RENAME COLUMN article_id TO publication_id;

-- Restricciones (las de clave primaria y unique renombran también su índice).
ALTER TABLE content.publications RENAME CONSTRAINT articles_pkey TO publications_pkey;
ALTER TABLE content.publications RENAME CONSTRAINT articles_slug_key TO publications_slug_key;
ALTER TABLE content.publications RENAME CONSTRAINT articles_status_check TO publications_status_check;
ALTER TABLE content.publications RENAME CONSTRAINT articles_article_type_check TO publications_publication_type_check;
ALTER TABLE content.publication_images RENAME CONSTRAINT article_images_pkey TO publication_images_pkey;
ALTER TABLE content.publication_images RENAME CONSTRAINT article_images_one_source TO publication_images_one_source;
ALTER TABLE content.publication_images RENAME CONSTRAINT article_images_article_id_fkey TO publication_images_publication_id_fkey;
ALTER TABLE content.publication_videos RENAME CONSTRAINT article_videos_pkey TO publication_videos_pkey;
ALTER TABLE content.publication_videos RENAME CONSTRAINT article_videos_article_id_fkey TO publication_videos_publication_id_fkey;

ALTER INDEX content.ix_articles_status RENAME TO ix_publications_status;
ALTER INDEX content.ix_articles_author_id RENAME TO ix_publications_author_id;
ALTER INDEX content.ix_articles_category_id RENAME TO ix_publications_category_id;
ALTER INDEX content.ix_articles_status_published_at RENAME TO ix_publications_status_published_at;
ALTER INDEX content.ix_articles_status_scheduled_at RENAME TO ix_publications_status_scheduled_at;
ALTER INDEX content.ix_articles_search_vector RENAME TO ix_publications_search_vector;

-- Valores guardados: tipo de contenido (me gusta, visitas), sección de anuncios y módulo de permisos.
UPDATE engagement.content_likes SET content_type = 'PUBLICATION' WHERE content_type = 'ARTICLE';
UPDATE engagement.content_views_daily SET content_type = 'PUBLICATION' WHERE content_type = 'ARTICLE';
UPDATE advertising.campaigns SET target_sections = array_replace(target_sections, 'ARTICLE', 'PUBLICATION')
 WHERE 'ARTICLE' = ANY (target_sections);

ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_module_check;
ALTER TABLE identity.worker_permissions DROP CONSTRAINT worker_permissions_level_by_module;
UPDATE identity.worker_permissions SET module = 'PUBLICATIONS' WHERE module = 'ARTICLES';
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_module_check CHECK (module IN (
    'PUBLICATIONS','PLACES','EVENTS','GALLERIES','DIRECTORY','SERIES','CATEGORIES','STATS','ADVERTISING','WORKERS','SETTINGS'));
ALTER TABLE identity.worker_permissions ADD CONSTRAINT worker_permissions_level_by_module CHECK (
    (module IN ('PUBLICATIONS','PLACES','EVENTS','GALLERIES','DIRECTORY','SERIES') AND level = 'PUBLISH')
    OR (module IN ('CATEGORIES','STATS','ADVERTISING','WORKERS','SETTINGS') AND level = 'ACCESS'));
