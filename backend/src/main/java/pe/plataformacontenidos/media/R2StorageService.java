package pe.plataformacontenidos.media;

import java.net.URI;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * Imágenes en Cloudflare R2 en vez del disco del VPS: el disco no se llena y,
 * con {@code publicBaseUrl}, Cloudflare las entrega directo sin que el VPS
 * envíe los bytes. R2 habla la API de S3; solo cambia el endpoint.
 *
 * <p>Se activa con {@code app.media.storage=r2}; si no, sigue el disco local
 * (LocalFilesystemStorageService). ImageService no cambia: depende de la
 * interfaz StorageService (inversión de dependencias; patrón Strategy).
 */
@Service
@ConditionalOnProperty(name = "app.media.storage", havingValue = "r2")
@EnableConfigurationProperties(R2Properties.class)
public class R2StorageService implements StorageService {

    /** Los nombres son UUID y nunca se reescriben: se pueden cachear un año sin riesgo. */
    static final String CACHE_CONTROL = "public, max-age=31536000, immutable";

    private final S3Client client;
    private final String bucket;
    private final String publicBaseUrl;

    @Autowired
    public R2StorageService(R2Properties properties) {
        this(buildClient(properties), properties);
    }

    R2StorageService(S3Client client, R2Properties properties) {
        this.client = client;
        this.bucket = requireText(properties.bucket(), "app.media.r2.bucket");
        this.publicBaseUrl = stripTrailingSlash(properties.publicBaseUrl());
    }

    @Override
    public void store(String storedFilename, byte[] content) {
        client.putObject(PutObjectRequest.builder()
                .bucket(bucket)
                .key(checkedKey(storedFilename))
                .contentType(contentTypeOf(storedFilename))
                .cacheControl(CACHE_CONTROL)
                .build(), RequestBody.fromBytes(content));
    }

    @Override
    public byte[] load(String storedFilename) {
        return client.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(bucket)
                .key(checkedKey(storedFilename))
                .build()).asByteArray();
    }

    @Override
    public void delete(String storedFilename) {
        client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(checkedKey(storedFilename))
                .build());
    }

    @Override
    public Optional<String> publicUrl(String storedFilename) {
        return publicBaseUrl == null ? Optional.empty() : Optional.of(publicBaseUrl + "/" + checkedKey(storedFilename));
    }

    private static S3Client buildClient(R2Properties properties) {
        String accountId = requireText(properties.accountId(), "app.media.r2.account-id");
        return S3Client.builder()
                .endpointOverride(URI.create("https://" + accountId + ".r2.cloudflarestorage.com"))
                // R2 no tiene regiones de AWS: «auto» es el valor que documenta Cloudflare.
                .region(Region.of("auto"))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(
                        requireText(properties.accessKeyId(), "app.media.r2.access-key-id"),
                        requireText(properties.secretAccessKey(), "app.media.r2.secret-access-key"))))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                // Los checksums CRC que el SDK agrega por defecto desde 2.30 no los acepta R2.
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .build();
    }

    /** Mismo criterio que el disco local: el nombre lo genera ImageProcessor, pero se revalida (defensa en profundidad). */
    static String checkedKey(String storedFilename) {
        if (storedFilename == null || !storedFilename.matches("[A-Za-z0-9-]+\\.[a-z0-9]+")) {
            throw new IllegalArgumentException("Nombre de archivo inválido: " + storedFilename);
        }
        return storedFilename;
    }

    static String contentTypeOf(String storedFilename) {
        String ext = storedFilename.substring(storedFilename.lastIndexOf('.') + 1);
        return switch (ext) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            case "gif" -> "image/gif";
            default -> "application/octet-stream";
        };
    }

    private static String requireText(String value, String property) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Falta " + property + " para guardar las imágenes en Cloudflare R2");
        }
        return value.trim();
    }

    private static String stripTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }
}
