package pe.plataformacontenidos.media;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.shared.FixedWindowRateLimiter;

@Service
@Transactional
@EnableConfigurationProperties(MediaProperties.class)
public class ImageService {

    private static final String RATE_LIMIT_KEY_PREFIX = "image_upload:";

    private final ImageRepository imageRepository;
    private final StorageService storageService;
    private final ImageProcessor imageProcessor;
    private final FixedWindowRateLimiter rateLimiter;
    private final MediaProperties properties;
    private final AuditService auditService;

    public ImageService(ImageRepository imageRepository, StorageService storageService,
            ImageProcessor imageProcessor, FixedWindowRateLimiter rateLimiter, MediaProperties properties,
            AuditService auditService) {
        this.imageRepository = imageRepository;
        this.storageService = storageService;
        this.imageProcessor = imageProcessor;
        this.rateLimiter = rateLimiter;
        this.properties = properties;
        this.auditService = auditService;
    }

    public Image upload(byte[] rawBytes, String originalFilename, String altText, UUID uploadedBy) {
        String rateLimitKey = uploadedBy.toString();
        if (rateLimiter.isBlocked(RATE_LIMIT_KEY_PREFIX, rateLimitKey, properties.uploadMaxAttempts())) {
            throw new TooManyUploadsException();
        }
        rateLimiter.recordAttempt(RATE_LIMIT_KEY_PREFIX, rateLimitKey, Duration.ofMinutes(properties.uploadWindowMinutes()));

        ImageProcessor.ProcessedImage processed = imageProcessor.process(rawBytes);
        String storedFilename = UUID.randomUUID() + "." + processed.extension();
        storageService.store(storedFilename, processed.content());

        Image image = new Image(sanitizeFilename(originalFilename), storedFilename, processed.contentType(),
                processed.content().length, processed.width(), processed.height(), altText, uploadedBy);
        Image saved = imageRepository.save(image);

        auditService.record("IMAGE_UPLOADED", AuditResult.SUCCESS, uploadedBy, null, "image",
                saved.getId().toString(), null);
        return saved;
    }

    public Image updateAltText(UUID imageId, String altText, UUID actingUserId, Role actingRole) {
        Image image = getOrThrow(imageId);
        requireOwnerOrEditor(image, actingUserId, actingRole);
        image.setAltText(altText);
        return imageRepository.save(image);
    }

    public void delete(UUID imageId, UUID actingUserId, Role actingRole) {
        Image image = getOrThrow(imageId);
        requireOwnerOrEditor(image, actingUserId, actingRole);
        storageService.delete(image.getStoredFilename());
        imageRepository.delete(image);
        auditService.record("IMAGE_DELETED", AuditResult.SUCCESS, actingUserId, null, "image", imageId.toString(),
                null);
    }

    public Image getOrThrow(UUID id) {
        return imageRepository.findById(id).orElseThrow(() -> new ImageNotFoundException(id));
    }

    public byte[] loadFile(UUID id) {
        Image image = getOrThrow(id);
        return storageService.load(image.getStoredFilename());
    }

    public List<Image> listForAdmin(UUID actingUserId, Role actingRole) {
        if (isEditorOrAbove(actingRole)) {
            return imageRepository.findAll();
        }
        return imageRepository.findByUploadedByOrderByCreatedAtDesc(actingUserId);
    }

    private void requireOwnerOrEditor(Image image, UUID actingUserId, Role actingRole) {
        if (!isEditorOrAbove(actingRole) && !image.isOwnedBy(actingUserId)) {
            throw new ImageAccessDeniedException();
        }
    }

    private boolean isEditorOrAbove(Role role) {
        return role == Role.EDITOR || role == Role.ADMIN || role == Role.SUPER_ADMIN;
    }

    private String sanitizeFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "imagen";
        }
        // Solo para mostrar en el panel admin; nunca se usa para resolver rutas de archivo.
        String base = originalFilename.replaceAll("[\\\\/\\x00]", "_");
        return base.length() > 200 ? base.substring(0, 200) : base;
    }
}
