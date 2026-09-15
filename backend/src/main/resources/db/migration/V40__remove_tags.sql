-- Se retira el sistema de etiquetas (tags): era puramente decorativo, sin uso
-- real en filtros, búsqueda ni contenido relacionado (confirmado por auditoría
-- de código previa). El dueño de la plataforma decidió eliminarlo en vez de
-- invertir en conectarlo a esos flujos. Se elimina primero la tabla de unión
-- (FK-safe) y luego la tabla de etiquetas; el esquema taxonomy no se elimina
-- porque taxonomy.categories sigue viviendo ahí.
DROP TABLE content.article_tags;
DROP TABLE taxonomy.tags;
