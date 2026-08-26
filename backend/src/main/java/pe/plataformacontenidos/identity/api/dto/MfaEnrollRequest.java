package pe.plataformacontenidos.identity.api.dto;

/**
 * currentCode solo es obligatorio cuando la cuenta ya tiene MFA habilitado y
 * se está reemplazando el secreto (ver MfaService.startEnrollment): sin él,
 * un access token robado bastaría para desactivar el MFA de la cuenta sin
 * conocer el código actual. En el primer enrolamiento (todavía no hay nada
 * que proteger) puede omitirse.
 */
public record MfaEnrollRequest(String currentCode) {
}
