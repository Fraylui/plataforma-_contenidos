package pe.plataformacontenidos.identity;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/**
 * Contraseña temporal de un trabajador (spec 2a §5): 20 caracteres de
 * SecureRandom, sin caracteres que se confunden al dictarla o copiarla a
 * mano (0/O, 1/l/I). Se muestra una sola vez.
 */
@Component
public class TemporaryPasswordGenerator {

    static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    static final int LENGTH = 20;

    private final SecureRandom random = new SecureRandom();

    public String next() {
        StringBuilder password = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            password.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return password.toString();
    }
}
