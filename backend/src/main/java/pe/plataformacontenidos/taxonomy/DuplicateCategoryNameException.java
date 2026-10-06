package pe.plataformacontenidos.taxonomy;

public class DuplicateCategoryNameException extends RuntimeException {
    public DuplicateCategoryNameException(String name) {
        super("Ya existe un tema llamado \"" + name + "\"");
    }
}
