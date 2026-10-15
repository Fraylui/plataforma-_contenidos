package pe.plataformacontenidos.shared.publishing;

/**
 * Estados de cualquier contenido (Publicación, Lugar, Evento, Galería,
 * Directorio). Flujo de plataforma: quien tiene el módulo publica directo,
 * sin paso de aprobación (decisión del dueño 2026-10-15, V54). El texto para la persona está en
 * {@link #label()}.
 */
public enum PublicationStatus {
    DRAFT("Borrador"),
    SCHEDULED("Programado"),
    PUBLISHED("Publicado"),
    ARCHIVED("Archivado");

    private final String label;

    PublicationStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
