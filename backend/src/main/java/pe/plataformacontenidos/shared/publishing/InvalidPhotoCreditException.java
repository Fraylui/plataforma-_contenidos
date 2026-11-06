package pe.plataformacontenidos.shared.publishing;

/** Foto de otra persona (con crédito) sin confirmar el permiso, o crédito demasiado largo. */
public class InvalidPhotoCreditException extends RuntimeException {

    public InvalidPhotoCreditException() {
        super("Si la foto es de otra persona, escribe su nombre (hasta 120 letras) y confirma que tienes su permiso por escrito o una licencia libre.");
    }
}
