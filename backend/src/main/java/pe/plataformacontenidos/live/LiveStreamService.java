package pe.plataformacontenidos.live;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.shared.YouTubeUrlParser;
import pe.plataformacontenidos.series.SeriesNotFoundException;
import pe.plataformacontenidos.series.SeriesService;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Transmisiones en vivo de YouTube vistas dentro del sitio. Una sola a la
 * vez en vivo: el inicio muestra "En vivo ahora" con esa.
 */
@Service
@Transactional
public class LiveStreamService {

    /** Una transmisión olvidada en vivo se termina sola pasado este tiempo. */
    static final Duration MAX_LIVE = Duration.ofHours(12);

    private final LiveStreamRepository repository;
    private final CategoryService categoryService;
    private final SeriesService seriesService;
    private final AuditService auditService;

    public LiveStreamService(LiveStreamRepository repository, CategoryService categoryService,
            SeriesService seriesService, AuditService auditService) {
        this.repository = repository;
        this.categoryService = categoryService;
        this.seriesService = seriesService;
        this.auditService = auditService;
    }

    public record LiveInput(String videoUrl, String title, String description, UUID categoryId, UUID seriesId,
            Instant scheduledStart) {
    }

    public LiveStream create(LiveInput input, UUID authorId) {
        String videoId = videoIdFrom(input.videoUrl());
        validateRefs(input);
        String title = input.title().strip();
        LiveStream stream = repository.save(new LiveStream(uniqueSlugFrom(title), title, blankToNull(input.description()),
                videoId, input.categoryId(), input.seriesId(), authorId, input.scheduledStart()));
        audit("LIVE_SCHEDULED", stream, authorId);
        return stream;
    }

    public LiveStream update(UUID id, LiveInput input, UUID actingUserId) {
        LiveStream stream = getOrThrow(id);
        String videoId = videoIdFrom(input.videoUrl());
        validateRefs(input);
        stream.update(input.title().strip(), blankToNull(input.description()), videoId, input.categoryId(),
                input.seriesId(), input.scheduledStart());
        audit("LIVE_UPDATED", stream, actingUserId);
        return stream;
    }

    /** "Estamos en vivo": solo una a la vez, así el inicio nunca duda cuál mostrar. */
    public LiveStream goLive(UUID id, UUID actingUserId) {
        LiveStream stream = getOrThrow(id);
        repository.findFirstByStatusOrderByStartedAtDesc(LiveStream.Status.LIVE)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new InvalidLiveStreamException("Ya hay una transmisión en vivo («" + other.getTitle()
                            + "»): termínala primero.");
                });
        stream.goLive(Instant.now());
        audit("LIVE_STARTED", stream, actingUserId);
        return stream;
    }

    public LiveStream end(UUID id, UUID actingUserId) {
        LiveStream stream = getOrThrow(id);
        stream.end(Instant.now());
        audit("LIVE_ENDED", stream, actingUserId);
        return stream;
    }

    public LiveStream cancel(UUID id, UUID actingUserId) {
        LiveStream stream = getOrThrow(id);
        stream.cancel();
        audit("LIVE_CANCELLED", stream, actingUserId);
        return stream;
    }

    /** Tarea de seguridad: termina lo que siga en vivo después de {@link #MAX_LIVE}. Devuelve cuántas terminó. */
    public int endForgotten() {
        Instant now = Instant.now();
        List<LiveStream> forgotten = repository.findByStatusAndStartedAtBefore(LiveStream.Status.LIVE, now.minus(MAX_LIVE));
        forgotten.forEach(stream -> {
            stream.end(now);
            auditService.record("LIVE_ENDED_AUTOMATICALLY", AuditResult.SUCCESS, null, null, "live",
                    stream.getId().toString(), null);
        });
        return forgotten.size();
    }

    // ---------- lectura ----------

    @Transactional(readOnly = true)
    public Page<LiveStream> listForAdmin(Pageable pageable) {
        return repository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional(readOnly = true)
    public LiveStream getForAdmin(UUID id) {
        return getOrThrow(id);
    }

    @Transactional(readOnly = true)
    public Optional<LiveStream> current() {
        return repository.findFirstByStatusOrderByStartedAtDesc(LiveStream.Status.LIVE);
    }

    @Transactional(readOnly = true)
    public List<LiveStream> upcoming() {
        return repository.findTop10ByStatusOrderByScheduledStartAscCreatedAtDesc(LiveStream.Status.SCHEDULED);
    }

    /** Página pública: programada, en vivo o terminada (la repetición sigue en YouTube); nunca cancelada. */
    @Transactional(readOnly = true)
    public LiveStream getPublicBySlug(String slug) {
        return repository.findBySlug(slug)
                .filter(stream -> stream.getStatus() != LiveStream.Status.CANCELLED)
                .orElseThrow(() -> new LiveStreamNotFoundException(slug));
    }

    // ---------- ayudas ----------

    private static String videoIdFrom(String url) {
        return YouTubeUrlParser.extractVideoId(url)
                .orElseThrow(() -> new InvalidLiveInputException("Pega el link de la transmisión de YouTube."));
    }

    private void validateRefs(LiveInput input) {
        if (input.categoryId() == null || !categoryService.existsActive(input.categoryId())) {
            throw new CategoryNotFoundException(input.categoryId());
        }
        if (input.seriesId() != null) {
            try {
                seriesService.getForAdmin(input.seriesId());
            } catch (SeriesNotFoundException e) {
                throw new InvalidLiveInputException("La serie elegida ya no existe.");
            }
        }
    }

    private LiveStream getOrThrow(UUID id) {
        return repository.findById(id).orElseThrow(() -> new LiveStreamNotFoundException(id));
    }

    private String uniqueSlugFrom(String title) {
        String base = Slugify.slugify(title);
        String candidate = base.isBlank() ? "en-vivo" : base;
        String root = candidate;
        int suffix = 2;
        while (repository.existsBySlug(candidate)) {
            candidate = root + "-" + suffix++;
        }
        return candidate;
    }

    private void audit(String action, LiveStream stream, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "live", stream.getId().toString(), null);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
