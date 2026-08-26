-- Conecta Content con Geography (CONTEXTO.md sección 4, ejemplo
-- "Turismo → Ayacucho → Huamanga"). Opcional: no todo contenido tiene una
-- ubicación asociada (ej. Tecnología/IA). Sin FK por el mismo motivo que
-- category_id: pertenece al esquema geography, se valida en ArticleService
-- (sección 38).
ALTER TABLE content.articles ADD COLUMN geography_id UUID;

CREATE INDEX ix_articles_geography_id ON content.articles (geography_id);
CREATE INDEX ix_articles_status_geography_id ON content.articles (status, geography_id);
