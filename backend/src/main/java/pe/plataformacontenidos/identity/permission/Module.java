package pe.plataformacontenidos.identity.permission;

/** Módulos del panel que se asignan a un trabajador (spec 2a §3.2). */
public enum Module {
    PUBLICATIONS(true),
    PLACES(true),
    CELEBRATIONS(true),
    GALLERIES(true),
    /** Series conectadas a listas de YouTube y sus episodios. */
    SERIES(true),
    /** Historias que caducan a las 24 h (y sus Destacadas). */
    STORIES(true),
    CATEGORIES(false),
    STATS(false),
    ADVERTISING(false),
    /** Crear y administrar trabajadores (nunca la cuenta del dueño). */
    WORKERS(false),
    /** Configuración del sitio (nombre, logo, redes). */
    SETTINGS(false);

    private final boolean content;

    Module(boolean content) {
        this.content = content;
    }

    /** Los módulos de contenido usan PUBLISH; el resto, ACCESS. */
    public boolean isContent() {
        return content;
    }
}
