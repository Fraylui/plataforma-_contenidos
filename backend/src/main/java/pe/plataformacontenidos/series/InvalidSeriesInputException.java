package pe.plataformacontenidos.series;

/** Dato inválido al crear o editar una serie: link no reconocido o repetido, video ya agregado, portada inexistente. */
public class InvalidSeriesInputException extends RuntimeException {

    public InvalidSeriesInputException(String message) {
        super(message);
    }
}
