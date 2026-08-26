package pe.plataformacontenidos.identity.mfa;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.mfa")
public record MfaProperties(String encryptionKey, String issuer) {
}
