package pe.plataformacontenidos.identity.api.dto;

public record MfaEnrollmentResponse(String provisioningUri, String secretBase32) {
}
