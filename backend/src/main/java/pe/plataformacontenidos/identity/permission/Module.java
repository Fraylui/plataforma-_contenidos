package pe.plataformacontenidos.identity.permission;

/** Módulos del panel que se asignan a un trabajador (spec 2a §3.2). */
public enum Module {
    ARTICLES(true),
    PLACES(true),
    EVENTS(true),
    GALLERIES(true),
    DIRECTORY(true),
    CATEGORIES(false),
    STATS(false),
    ADVERTISING(false);

    private final boolean content;

    Module(boolean content) {
        this.content = content;
    }

    /** Los 5 tipos de contenido usan CREATE/PUBLISH; el resto, ACCESS. */
    public boolean isContent() {
        return content;
    }
}
