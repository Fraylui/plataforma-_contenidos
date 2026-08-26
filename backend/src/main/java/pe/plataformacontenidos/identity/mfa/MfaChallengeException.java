package pe.plataformacontenidos.identity.mfa;

/** Código TOTP/backup ausente o inválido en un flujo que lo requiere. */
public class MfaChallengeException extends RuntimeException {
    public MfaChallengeException(String message) {
        super(message);
    }
}
