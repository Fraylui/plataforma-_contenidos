package pe.plataformacontenidos.stories;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.catalog.ContentLookup;
import pe.plataformacontenidos.catalog.ContentLookup.ContentRef;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.media.Image;
import pe.plataformacontenidos.media.ImageNotFoundException;
import pe.plataformacontenidos.media.ImagePurpose;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Historias del sitio (spec 2026-10-23): se publican en lote (hasta 10, un
 * tema), se ven 24 h y luego desaparecen solas; las Destacadas se quedan en
 * la página de su tema. Caducar es una condición de consulta, no un job: a
 * la hora exacta ya no se ve.
 */
@Service
@Transactional
public class StoryService {

    /** Cuánto se guardan las terminadas (estadísticas en el panel) antes de borrarlas con su foto. */
    static final Duration KEEP_ENDED = Duration.ofDays(7);

    public enum AdminTab { ACTIVE, HIGHLIGHTED, ENDED }

    /**
     * Una historia del lote. {@code imageId} o {@code background} (uno solo);
     * enlace a contenido ({@code linkType} + {@code linkId}) o {@code youtubeUrl}, opcionales.
     */
    public record StoryItem(UUID imageId, Story.Background background, String caption,
            Story.CaptionPosition captionPosition, ContentType linkType, UUID linkId, String youtubeUrl,
            boolean highlighted) {
    }

    private final StoryRepository repository;
    private final CategoryService categoryService;
    private final ImageService imageService;
    private final ContentLookup contentLookup;
    private final AuditService auditService;
    private final Clock clock;

    @Autowired
    public StoryService(StoryRepository repository, CategoryService categoryService, ImageService imageService,
            ContentLookup contentLookup, AuditService auditService) {
        this(repository, categoryService, imageService, contentLookup, auditService, Clock.systemUTC());
    }

    StoryService(StoryRepository repository, CategoryService categoryService, ImageService imageService,
            ContentLookup contentLookup, AuditService auditService, Clock clock) {
        this.repository = repository;
        this.categoryService = categoryService;
        this.imageService = imageService;
        this.contentLookup = contentLookup;
        this.auditService = auditService;
        this.clock = clock;
    }

    // ---------- escritura ----------

    /** Todas o ninguna: un lote con un error no deja historias a medias. */
    public List<Story> createBatch(UUID categoryId, List<StoryItem> items, UUID authorId) {
        StoryRules.validateBatch(items);
        requireActiveCategory(categoryId);
        Instant now = clock.instant();
        List<Story> created = items.stream().map(item -> {
            requireStoryImage(item.imageId());
            requirePublishedLink(item);
            Story story = new Story(categoryId, item.imageId(), item.background(), authorId, now);
            describe(story, item, now);
            story.setHighlighted(item.highlighted(), now);
            return repository.save(story);
        }).toList();
        created.forEach(story -> audit("STORY_CREATED", story, authorId));
        return created;
    }

    /** Texto, posición, enlace y Destacada; la foto o el fondo no cambian. */
    public Story update(UUID id, StoryItem item, UUID actingUserId) {
        Story story = getOrThrow(id);
        StoryItem merged = new StoryItem(story.getImageId(), story.getBackground(), item.caption(),
                item.captionPosition(), item.linkType(), item.linkId(), item.youtubeUrl(), item.highlighted());
        StoryRules.validateItem(merged);
        requirePublishedLink(merged);
        Instant now = clock.instant();
        describe(story, merged, now);
        story.setHighlighted(merged.highlighted(), now);
        audit("STORY_UPDATED", story, actingUserId);
        return story;
    }

    public Story setHighlighted(UUID id, boolean highlighted, UUID actingUserId) {
        Story story = getOrThrow(id);
        story.setHighlighted(highlighted, clock.instant());
        audit("STORY_HIGHLIGHTED", story, actingUserId);
        return story;
    }

    public void delete(UUID id, UUID actingUserId) {
        Story story = getOrThrow(id);
        repository.delete(story);
        audit("STORY_DELETED", story, actingUserId);
    }

    /** El visitante tocó el botón del enlace (ya filtrado por StoryCtaCounter). */
    public void recordCtaClick(UUID id) {
        repository.incrementCtaClicks(id);
    }

    // ---------- lectura ----------

    /** Fila del Inicio: sin caducar, de la más vieja a la más nueva (orden de reproducción). */
    @Transactional(readOnly = true)
    public List<Story> listActive() {
        return repository.findByExpiresAtAfterOrderByPublishedAtAsc(clock.instant());
    }

    /** Destacadas de un tema, la más nueva primero. */
    @Transactional(readOnly = true)
    public List<Story> listHighlights(UUID categoryId) {
        return repository.findByCategoryIdAndHighlightedTrueOrderByPublishedAtDesc(categoryId);
    }

    /** Una historia que se puede ver ahora (sin caducar o Destacada). */
    @Transactional(readOnly = true)
    public Optional<Story> findVisible(UUID id) {
        Instant now = clock.instant();
        return repository.findById(id).filter(story -> story.isVisible(now));
    }

    @Transactional(readOnly = true)
    public List<Story> listForAdmin(AdminTab tab) {
        Instant now = clock.instant();
        return switch (tab) {
            case ACTIVE -> repository.findByExpiresAtAfterOrderByPublishedAtAsc(now).reversed();
            case HIGHLIGHTED -> repository.findByHighlightedTrueOrderByPublishedAtDesc();
            case ENDED -> repository.findByHighlightedFalseAndExpiresAtBetweenOrderByExpiresAtDesc(now.minus(KEEP_ENDED), now);
        };
    }

    @Transactional(readOnly = true)
    public Story getForAdmin(UUID id) {
        return getOrThrow(id);
    }

    /** El contenido al que lleva, si sigue publicado; si se despublicó, la historia se muestra sin botón. */
    @Transactional(readOnly = true)
    public Optional<ContentRef> linkOf(Story story) {
        return contentLookup.find(story.getLinkContentType(), story.getLinkContentId());
    }

    // ---------- ayudas ----------

    private void describe(Story story, StoryItem item, Instant now) {
        story.describe(StoryRules.caption(item), item.captionPosition(), item.linkType(), item.linkId(),
                StoryRules.youtubeVideoId(item), now);
    }

    private void requireActiveCategory(UUID categoryId) {
        if (categoryId == null || !categoryService.existsActive(categoryId)) {
            throw new CategoryNotFoundException(categoryId);
        }
    }

    private void requireStoryImage(UUID imageId) {
        if (imageId == null) {
            return;
        }
        Image image;
        try {
            image = imageService.getOrThrow(imageId);
        } catch (ImageNotFoundException e) {
            throw new InvalidStoryException("Una de las fotos ya no existe: vuelve a subirla.");
        }
        if (image.getPurpose() != ImagePurpose.STORY) {
            throw new InvalidStoryException("Sube la foto desde Historias (las de la biblioteca no se usan aquí).");
        }
    }

    private void requirePublishedLink(StoryItem item) {
        if (item.linkType() != null && contentLookup.find(item.linkType(), item.linkId()).isEmpty()) {
            throw new InvalidStoryException("El contenido elegido no está publicado.");
        }
    }

    private Story getOrThrow(UUID id) {
        return repository.findById(id).orElseThrow(() -> new StoryNotFoundException(id));
    }

    private void audit(String action, Story story, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "story", story.getId().toString(), null);
    }
}
