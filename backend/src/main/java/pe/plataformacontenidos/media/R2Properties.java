package pe.plataformacontenidos.media;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cloudflare R2 (CONTEXTO.md 25.x, «Imágenes en Cloudflare R2»). Solo se usa
 * con {@code app.media.storage=r2}. Las credenciales vienen de variables de
 * entorno, nunca del repositorio (ISO 27001 A.8.24 / OWASP A02).
 *
 * @param accountId       id de la cuenta de Cloudflare (arma el endpoint S3)
 * @param accessKeyId     token de API de R2 con permiso solo sobre el bucket
 * @param secretAccessKey secreto de ese token
 * @param bucket          nombre del bucket
 * @param publicBaseUrl   dominio público del bucket (p. ej. https://media.tusitio.pe);
 *                        si está, las imágenes se sirven desde ahí y no pasan por el VPS
 */
@ConfigurationProperties(prefix = "app.media.r2")
public record R2Properties(
        String accountId,
        String accessKeyId,
        String secretAccessKey,
        String bucket,
        String publicBaseUrl) {
}
