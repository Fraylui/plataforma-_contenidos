package pe.plataformacontenidos.catalog;

import java.util.List;
import java.util.regex.Pattern;
import pe.plataformacontenidos.identity.permission.Module;

/**
 * Ficha de una tabla de contenido: lo que los lectores transversales (feed,
 * inicio del panel, temas, visitas, usos de imágenes) necesitan saber de ella
 * sin depender del módulo que la dueña. Cada módulo declara la suya como bean
 * y {@link ContentRegistry} las reúne: un tipo nuevo se agrega declarando su
 * ficha, sin editar a quienes la leen (principio abierto/cerrado).
 *
 * <p>Los nombres se validan como identificadores SQL simples porque se
 * concatenan en consultas; nunca vienen del usuario.
 *
 * @param table           esquema.tabla
 * @param type            tipo con visitas y me gusta propios; null si la tabla agrupa a otros (una serie)
 * @param module          módulo de permisos que da acceso a esta tabla
 * @param titleColumn     columna que hace de título
 * @param readSelect      fila de lectura estándar (type, id, title, slug, status, created_at, published_at); null sin tipo
 * @param createdInPanel  se crea a mano en el panel (los episodios llegan solos de YouTube)
 * @param categorized     tiene category_id y status: cuenta para los temas con contenido
 * @param versionsFeed    su updated_at marca la versión del feed
 * @param imagesTable     tabla de sus fotos (columna image_id); null si no tiene
 * @param imageIdColumns  columnas propias con el id de una imagen (una portada)
 * @param imageUrlColumns columnas de texto que pueden llevar la URL /api/v1/images/{id}/file
 * @param inDashboard     entra en los totales del Inicio del panel (las historias, efímeras, no)
 * @param liveCondition   condición SQL de «visible en el sitio» para contar visitas; SQL fijo del código
 *                        (nunca del usuario), por eso no se valida como identificador
 */
public record ContentSource(
        String table,
        ContentType type,
        Module module,
        String titleColumn,
        String readSelect,
        boolean createdInPanel,
        boolean categorized,
        boolean versionsFeed,
        String imagesTable,
        List<String> imageIdColumns,
        List<String> imageUrlColumns,
        boolean inDashboard,
        String liveCondition) {

    private static final Pattern IDENTIFIER = Pattern.compile("[a-z_]+([.][a-z_]+)?");

    public ContentSource {
        requireIdentifier(table);
        requireIdentifier(titleColumn);
        if (imagesTable != null) {
            requireIdentifier(imagesTable);
        }
        imageIdColumns = List.copyOf(imageIdColumns);
        imageUrlColumns = List.copyOf(imageUrlColumns);
        imageIdColumns.forEach(ContentSource::requireIdentifier);
        imageUrlColumns.forEach(ContentSource::requireIdentifier);
    }

    public static Builder of(String table, Module module) {
        return new Builder(table, module);
    }

    private static void requireIdentifier(String name) {
        if (name == null || !IDENTIFIER.matcher(name).matches()) {
            throw new IllegalArgumentException("Identificador SQL no válido en la ficha de contenido: " + name);
        }
    }

    public static final class Builder {

        private final String table;
        private final Module module;
        private ContentType type;
        private String titleColumn = "title";
        private String readSelect;
        private boolean createdInPanel = true;
        private boolean categorized;
        private boolean versionsFeed;
        private String imagesTable;
        private List<String> imageIdColumns = List.of();
        private List<String> imageUrlColumns = List.of();
        private boolean inDashboard = true;
        private String liveCondition = "status = 'PUBLISHED'";

        private Builder(String table, Module module) {
            this.table = table;
            this.module = module;
        }

        public Builder type(ContentType type) {
            this.type = type;
            return this;
        }

        public Builder titleColumn(String titleColumn) {
            this.titleColumn = titleColumn;
            return this;
        }

        /** Para una fila de lectura que no sale de la tabla sola (un episodio enlaza por el slug de su serie). */
        public Builder readSelect(String readSelect) {
            this.readSelect = readSelect;
            return this;
        }

        public Builder notCreatedInPanel() {
            this.createdInPanel = false;
            return this;
        }

        public Builder categorized() {
            this.categorized = true;
            return this;
        }

        public Builder versionsFeed() {
            this.versionsFeed = true;
            return this;
        }

        public Builder imagesTable(String imagesTable) {
            this.imagesTable = imagesTable;
            return this;
        }

        public Builder imageIdColumns(String... columns) {
            this.imageIdColumns = List.of(columns);
            return this;
        }

        public Builder imageUrlColumns(String... columns) {
            this.imageUrlColumns = List.of(columns);
            return this;
        }

        /** Fuera de los totales del Inicio del panel (contenido efímero). */
        public Builder notInDashboard() {
            this.inDashboard = false;
            return this;
        }

        /** Cuándo una fila cuenta como visible (por defecto, publicada). */
        public Builder liveCondition(String liveCondition) {
            this.liveCondition = liveCondition;
            return this;
        }

        public ContentSource build() {
            String select = readSelect;
            if (select == null && type != null) {
                select = "SELECT '" + type + "'::text AS type, id, " + titleColumn + " AS title, slug, status,"
                        + " created_at, published_at FROM " + table;
            }
            return new ContentSource(table, type, module, titleColumn, select, createdInPanel, categorized,
                    versionsFeed, imagesTable, imageIdColumns, imageUrlColumns, inDashboard, liveCondition);
        }
    }
}
