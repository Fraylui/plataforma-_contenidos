package pe.plataformacontenidos.identity.mfa;

/** CONTEXTO.md sección 36.5: "MFA obligatorio, sin excepción" para SUPER_ADMIN — ni el propio dueño de la cuenta puede desactivarlo. */
public class MfaDisableForbiddenException extends RuntimeException {
    public MfaDisableForbiddenException() {
        super("SUPER_ADMIN no puede desactivar su propio MFA (obligatorio, sin excepción)");
    }
}
