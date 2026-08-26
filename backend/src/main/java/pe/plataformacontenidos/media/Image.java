package pe.plataformacontenidos.media;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/**
 * Metadatos de una imagen. El archivo en sí vive detrás de StorageService
 * (local en el MVP, Object Storage + CDN después — CONTEXTO.md sección 10):
 * esta tabla nunca guarda el binario, solo storedFilename como referencia.
 */
@Entity
@Table(name = "images", schema = "media")
public class Image {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    /** Nombre generado (UUID + extensión), nunca el original: evita path traversal y colisiones. */
    @Column(name = "stored_filename", nullable = false, unique = true)
    private String storedFilename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private int width;

    @Column(nullable = false)
    private int height;

    /** Texto alternativo para accesibilidad/SEO (sección 43); recomendado, no forzado en el MVP. */
    @Column(name = "alt_text")
    private String altText;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Image() {
        // JPA
    }

    public Image(String originalFilename, String storedFilename, String contentType, long sizeBytes, int width,
            int height, String altText, UUID uploadedBy) {
        this.originalFilename = originalFilename;
        this.storedFilename = storedFilename;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.width = width;
        this.height = height;
        this.altText = altText;
        this.uploadedBy = uploadedBy;
    }

    public UUID getId() {
        return id;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public String getStoredFilename() {
        return storedFilename;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public String getAltText() {
        return altText;
    }

    public UUID getUploadedBy() {
        return uploadedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isOwnedBy(UUID userId) {
        return uploadedBy.equals(userId);
    }

    public void setAltText(String altText) {
        this.altText = altText;
    }
}
