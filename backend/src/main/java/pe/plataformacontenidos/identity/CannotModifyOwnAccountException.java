package pe.plataformacontenidos.identity;

/** Evita el bloqueo accidental más común: un admin desactivando su propia cuenta activa. */
public class CannotModifyOwnAccountException extends RuntimeException {
    public CannotModifyOwnAccountException() {
        super("No puedes desactivar tu propia cuenta");
    }
}
