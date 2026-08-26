package pe.plataformacontenidos.identity.api.dto;

public record TokenResponse(String accessToken, String refreshToken, String tokenType, boolean mfaSetupRequired) {
    public static TokenResponse of(String accessToken, String refreshToken, boolean mfaSetupRequired) {
        return new TokenResponse(accessToken, refreshToken, "Bearer", mfaSetupRequired);
    }
}
