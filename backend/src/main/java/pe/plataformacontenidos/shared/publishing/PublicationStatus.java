package pe.plataformacontenidos.shared.publishing;

/**
 * Estados de cualquier contenido (Publicación, Lugar, Evento, Galería,
 * Directorio). Flujo de plataforma, no de redacción: sin "aprobado" ni
 * "rechazado" (spec 2026-10-07 §1). El texto para la persona está en
 * {@link #label()}.
 */
public enum PublicationStatus {
    DRAFT("Borrador"),
    IN_REVIEW("Pendiente de aprobación"),
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
