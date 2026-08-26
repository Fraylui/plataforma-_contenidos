package pe.plataformacontenidos.identity;

/** Password correcta pero falta/es inválido el código MFA (usuario con MFA habilitado). */
public class MfaRequiredException extends RuntimeException {
    public MfaRequiredException() {
        super("Se requiere un código MFA válido");
    }
}
