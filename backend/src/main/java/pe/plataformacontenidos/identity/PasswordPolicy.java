package pe.plataformacontenidos.identity;

import java.nio.charset.StandardCharsets;

/**
 * Contraseña propia (spec 2a §5): mínimo 12 caracteres, máximo 72 bytes y
 * distinta de la actual. El tope es de BCrypt: solo usa los primeros 72
 * bytes y Spring Security rechaza lo demás con una excepción (era un 500).
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 12;
    public static final int MAX_BYTES = 72;

    private PasswordPolicy() {
    }

    public static void validate(String current, String candidate) {
        if (candidate == null || candidate.length() < MIN_LENGTH) {
            throw new WeakPasswordException("Usa al menos " + MIN_LENGTH + " caracteres.");
        }
        if (!fitsHashLimit(candidate)) {
            throw new WeakPasswordException("Es demasiado larga: usa como máximo " + MAX_BYTES
                    + " caracteres (las letras con tilde y la ñ cuentan doble).");
        }
        if (candidate.equals(current)) {
            throw new WeakPasswordException("La contraseña nueva debe ser distinta de la actual.");
        }
    }

    /** false si BCrypt no puede comparar esta contraseña (más de 72 bytes en UTF-8). */
    public static boolean fitsHashLimit(String password) {
        return password != null && password.getBytes(StandardCharsets.UTF_8).length <= MAX_BYTES;
    }
}
