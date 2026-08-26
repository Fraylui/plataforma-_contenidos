package pe.plataformacontenidos.media;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.media")
public record MediaProperties(
        String localStoragePath,
        long maxFileSizeBytes,
        int maxDimensionPixels,
        int uploadMaxAttempts,
        long uploadWindowMinutes) {
}
