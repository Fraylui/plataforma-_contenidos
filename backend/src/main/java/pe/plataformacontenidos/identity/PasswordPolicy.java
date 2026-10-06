package pe.plataformacontenidos.identity;

/** Contraseña propia (spec 2a §5): mínimo 12 caracteres y distinta de la actual. */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 12;

    private PasswordPolicy() {
    }

    public static void validate(String current, String candidate) {
        if (candidate == null || candidate.length() < MIN_LENGTH) {
            throw new WeakPasswordException("Usa al menos " + MIN_LENGTH + " caracteres.");
        }
        if (candidate.equals(current)) {
            throw new WeakPasswordException("La contraseña nueva debe ser distinta de la actual.");
        }
    }
}
