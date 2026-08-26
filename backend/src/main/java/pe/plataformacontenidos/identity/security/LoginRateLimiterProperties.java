package pe.plataformacontenidos.identity.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.login-rate-limit")
public record LoginRateLimiterProperties(int maxAttempts, long windowMinutes) {
}
