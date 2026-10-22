package pe.plataformacontenidos.series;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.shared.YouTubeUrlParser;
import pe.plataformacontenidos.media.ImageNotFoundException;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.HtmlSanitizer;
import pe.plataformacontenidos.shared.Slugify;
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.InvalidPublicationTransitionException;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Series conectadas a listas de YouTube y sus episodios. Los videos nuevos de
 * la lista entran ya publicados (decisión del dueño) — ver {@link #sync}.
 */
@Service
@Transactional
public class SeriesService {

    private final SeriesRepository seriesRepository;
    private final EpisodeRepository episodeRepository;
    private final YouTubePlaylistFeed feed;
    private final CategoryService categoryService;
    private final ImageService imageService;
    private final AuditService auditService;

    public SeriesService(SeriesRepository seriesRepository, EpisodeRepository episodeRepository,
            YouTubePlaylistFeed feed, CategoryService categoryService, ImageService imageService,
            AuditService auditService) {
        this.seriesRepository = seriesRepository;
        this.episodeRepository = episodeRepository;
        this.feed = feed;
        this.categoryService = categoryService;
        this.imageService = imageService;
        this.auditService = auditService;
    }

    public record SeriesInput(String playlistUrl, String title, String description, UUID categoryId, UUID coverImageId) {
    }

    /** Lo que muestra una portada del listado: cuántos episodios y el último. */
    public record SeriesCard(Series series, long episodeCount, Episode latest) {
    }

    /** Crea la serie a partir del link de la lista y trae sus episodios en el acto. */
    public Series create(SeriesInput input, UUID authorId) {
        String playlistId = YouTubePlaylistFeed.playlistIdFrom(input.playlistUrl());
        if (playlistId == null) {
            throw new InvalidSeriesInputException("Pega el link de una lista de reproducción de YouTube (el que tiene «list=»).");
        }
        if (seriesRepository.existsByYoutubePlaylistId(playlistId)) {
            throw new InvalidSeriesInputException("Esa lista de YouTube ya está conectada a otra serie.");
        }
        requireCategory(input.categoryId());
        YouTubePlaylistFeed.Feed playlist = feed.fetch(playlistId);
        String title = blankToNull(input.title()) != null ? input.title().strip()
                : Optional.ofNullable(playlist.title()).orElse("Serie sin título");

        Series series = seriesRepository.save(new Series(uniqueSlugFrom(title), title, blankToNull(input.description()),
                input.categoryId(), authorId, playlistId));
        importEntries(series, playlist.entries());
        series.recordSync(Instant.now(), null);
        audit("SERIES_CREATED", series, authorId);
        return series;
    }

    public Series update(UUID id, SeriesInput input, UUID actingUserId) {
        Series series = getOrThrow(id);
        if (series.getStatus() == PublicationStatus.ARCHIVED) {
            throw new InvalidPublicationTransitionException(series.getStatus(), "editar");
        }
        if (!series.getCategoryId().equals(input.categoryId())) {
            requireCategory(input.categoryId());
        }
        if (input.coverImageId() != null) {
            try {
                imageService.getOrThrow(input.coverImageId());
            } catch (ImageNotFoundException e) {
                throw new InvalidSeriesInputException("La imagen de portada ya no existe en la biblioteca.");
            }
        }
        String title = blankToNull(input.title()) != null ? input.title().strip() : series.getTitle();
        series.update(title, blankToNull(input.description()), input.categoryId(), input.coverImageId());
        return saveAndAudit(series, "SERIES_UPDATED", actingUserId);
    }

    public Series publish(UUID id, UUID actingUserId) {
        Series series = getOrThrow(id);
        series.publishNow(Instant.now());
        return saveAndAudit(series, "SERIES_PUBLISHED", actingUserId);
    }

    public Series schedule(UUID id, Instant when, UUID actingUserId) {
        Series series = getOrThrow(id);
        series.schedule(when, Instant.now());
        return saveAndAudit(series, "SERIES_SCHEDULED", actingUserId);
    }

    public Series returnToDraft(UUID id, UUID actingUserId) {
        Series series = getOrThrow(id);
        series.returnToDraft();
        return saveAndAudit(series, "SERIES_RETURNED_TO_DRAFT", actingUserId);
    }

    public Series archive(UUID id, UUID actingUserId) {
        Series series = getOrThrow(id);
        series.archive();
        return saveAndAudit(series, "SERIES_ARCHIVED", actingUserId);
    }

    /**
     * Trae de YouTube los videos que aún no están en la serie y los publica.
     * Un fallo de YouTube queda guardado en la serie (se ve en el panel) y se
     * reintenta en la próxima pasada; nunca rompe el sitio. Devuelve cuántos entraron.
     */
    public int sync(UUID id) {
        Series series = getOrThrow(id);
        try {
            int added = importEntries(series, feed.fetch(series.getYoutubePlaylistId()).entries());
            series.recordSync(Instant.now(), null);
            return added;
        } catch (PlaylistFeedException e) {
            series.recordSync(Instant.now(), e.getMessage());
            return 0;
        }
    }

    /** Episodio suelto (p. ej. anterior a los 15 que trae el feed): se agrega pegando el link del video. */
    public Episode addEpisode(UUID seriesId, String videoUrl, String title, String description, Instant publishedAt,
            UUID actingUserId) {
        Series series = getOrThrow(seriesId);
        String videoId = YouTubeUrlParser.extractVideoId(videoUrl)
                .orElseThrow(() -> new InvalidSeriesInputException("Pega el link de un video de YouTube."));
        if (!episodeRepository.findExistingVideoIds(seriesId, List.of(videoId)).isEmpty()) {
            throw new InvalidSeriesInputException("Ese video ya es un episodio de la serie.");
        }
        String episodeTitle = blankToNull(title) != null ? title.strip() : "Episodio " + videoId;
        Episode episode = episodeRepository.save(new Episode(seriesId, videoId, uniqueEpisodeSlug(seriesId, episodeTitle),
                episodeTitle, blankToNull(description), publishedAt != null ? publishedAt : Instant.now()));
        series.touchFeedVersion();
        audit("EPISODE_ADDED", series, actingUserId);
        return episode;
    }

    /** Título y notas propias del episodio (las notas se limpian con el mismo saneador que el resto del contenido). */
    public Episode updateEpisode(UUID seriesId, UUID episodeId, String title, String notes, UUID actingUserId) {
        Series series = getOrThrow(seriesId);
        Episode episode = episodeRepository.findById(episodeId)
                .filter(e -> e.getSeriesId().equals(seriesId))
                .orElseThrow(() -> new EpisodeNotFoundException(episodeId));
        String cleanNotes = blankToNull(notes) == null ? null : HtmlSanitizer.sanitize(notes);
        episode.updateNotes(blankToNull(title) != null ? title.strip() : episode.getTitle(), cleanNotes);
        series.touchFeedVersion();
        audit("EPISODE_UPDATED", series, actingUserId);
        return episode;
    }

    public Episode setEpisodeArchived(UUID seriesId, UUID episodeId, boolean archived, UUID actingUserId) {
        Series series = getOrThrow(seriesId);
        Episode episode = episodeRepository.findById(episodeId)
                .filter(e -> e.getSeriesId().equals(seriesId))
                .orElseThrow(() -> new EpisodeNotFoundException(episodeId));
        if (archived) {
            episode.archive();
        } else {
            episode.restore();
        }
        series.touchFeedVersion();
        audit(archived ? "EPISODE_ARCHIVED" : "EPISODE_RESTORED", series, actingUserId);
        return episode;
    }

    // ---------- lectura del panel ----------

    @Transactional(readOnly = true)
    public Page<Series> listForAdmin(AdminListQuery query) {
        return seriesRepository.findAll(query.specification("title"), query.pageable("title"));
    }

    @Transactional(readOnly = true)
    public Series getForAdmin(UUID id) {
        return getOrThrow(id);
    }

    @Transactional(readOnly = true)
    public Page<Episode> episodesForAdmin(UUID seriesId, Pageable pageable) {
        getOrThrow(seriesId);
        return episodeRepository.findBySeriesIdOrderByPublishedAtDesc(seriesId, pageable);
    }

    // ---------- lectura pública ----------

    @Transactional(readOnly = true)
    public Page<SeriesCard> listPublished(Pageable pageable) {
        Page<Series> page = seriesRepository.findByStatus(PublicationStatus.PUBLISHED, pageable);
        List<UUID> ids = page.getContent().stream().map(Series::getId).toList();
        Map<UUID, Long> counts = new HashMap<>();
        Map<UUID, Episode> latest = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] row : episodeRepository.countPublishedBySeries(ids)) {
                counts.put((UUID) row[0], (Long) row[1]);
            }
            latest.putAll(episodeRepository.findLatestPublished(ids).stream()
                    .collect(Collectors.toMap(Episode::getSeriesId, Function.identity(), (a, b) -> a)));
        }
        return page.map(s -> new SeriesCard(s, counts.getOrDefault(s.getId(), 0L), latest.get(s.getId())));
    }

    @Transactional(readOnly = true)
    public Series getPublishedBySlug(String slug) {
        return seriesRepository.findBySlugAndStatus(slug, PublicationStatus.PUBLISHED)
                .orElseThrow(() -> new SeriesNotFoundException(slug));
    }

    @Transactional(readOnly = true)
    public Page<Episode> publishedEpisodes(Series series, Pageable pageable) {
        return episodeRepository.findBySeriesIdAndStatusOrderByPublishedAtDesc(series.getId(), Episode.Status.PUBLISHED,
                pageable);
    }

    public record EpisodeView(Series series, Episode episode, Episode newer, Episode older) {
    }

    /** Episodio visible en el sitio (publicado y de una serie publicada), por id: para "me gusta". */
    @Transactional(readOnly = true)
    public Episode getPublishedEpisode(UUID episodeId) {
        Episode episode = episodeRepository.findById(episodeId)
                .filter(e -> e.getStatus() == Episode.Status.PUBLISHED)
                .orElseThrow(() -> new EpisodeNotFoundException(episodeId));
        seriesRepository.findById(episode.getSeriesId())
                .filter(s -> s.getStatus() == PublicationStatus.PUBLISHED)
                .orElseThrow(() -> new EpisodeNotFoundException(episodeId));
        return episode;
    }

    @Transactional(readOnly = true)
    public EpisodeView publishedEpisode(String seriesSlug, String episodeSlug) {
        Series series = getPublishedBySlug(seriesSlug);
        Episode episode = episodeRepository.findBySeriesIdAndSlugAndStatus(series.getId(), episodeSlug, Episode.Status.PUBLISHED)
                .orElseThrow(() -> new EpisodeNotFoundException(episodeSlug));
        Episode newer = episodeRepository.findFirstBySeriesIdAndStatusAndPublishedAtGreaterThanOrderByPublishedAtAsc(
                series.getId(), Episode.Status.PUBLISHED, episode.getPublishedAt()).orElse(null);
        Episode older = episodeRepository.findFirstBySeriesIdAndStatusAndPublishedAtLessThanOrderByPublishedAtDesc(
                series.getId(), Episode.Status.PUBLISHED, episode.getPublishedAt()).orElse(null);
        return new EpisodeView(series, episode, newer, older);
    }

    /** Un episodio con su serie, para el feed y los relacionados. */
    public record FeedEpisode(Episode episode, Series series) {
    }

    /** Episodios publicados (de series publicadas) para el feed; {@code categoryId} null = todos los temas. */
    @Transactional(readOnly = true)
    public List<FeedEpisode> listPublishedForFeed(UUID categoryId, Pageable pageable) {
        List<UUID> topics = categoryId == null ? List.of(new UUID(0, 0)) : List.of(categoryId);
        return episodeRepository.findPublishedForFeed(categoryId == null, topics, pageable).stream()
                .map(row -> new FeedEpisode((Episode) row[0], (Series) row[1]))
                .toList();
    }

    /** Buscador (CONTEXTO.md §16): mismo criterio que el resto de módulos.search (en blanco: nada). */
    @Transactional(readOnly = true)
    public List<FeedEpisode> search(String query, UUID categoryId, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        List<Episode> episodes = episodeRepository.search(query.trim(), categoryId, pageable);
        Map<UUID, Series> series = seriesRepository.findAllById(episodes.stream().map(Episode::getSeriesId).distinct().toList())
                .stream().collect(Collectors.toMap(Series::getId, Function.identity()));
        return episodes.stream().map(e -> new FeedEpisode(e, series.get(e.getSeriesId()))).toList();
    }

    // ---------- ayudas ----------

    private int importEntries(Series series, List<YouTubePlaylistFeed.FeedEntry> entries) {
        if (entries.isEmpty()) {
            return 0;
        }
        Set<String> existing = episodeRepository.findExistingVideoIds(series.getId(),
                entries.stream().map(YouTubePlaylistFeed.FeedEntry::videoId).toList());
        int added = 0;
        for (YouTubePlaylistFeed.FeedEntry entry : entries) {
            if (existing.contains(entry.videoId())) {
                continue;
            }
            episodeRepository.save(new Episode(series.getId(), entry.videoId(),
                    uniqueEpisodeSlug(series.getId(), entry.title()), entry.title(), entry.description(), entry.publishedAt()));
            existing.add(entry.videoId());
            added++;
        }
        if (added > 0) {
            series.touchFeedVersion();
        }
        return added;
    }

    private void requireCategory(UUID categoryId) {
        if (categoryId == null || !categoryService.existsActive(categoryId)) {
            throw new CategoryNotFoundException(categoryId);
        }
    }

    private Series getOrThrow(UUID id) {
        return seriesRepository.findById(id).orElseThrow(() -> new SeriesNotFoundException(id));
    }

    private String uniqueSlugFrom(String title) {
        String base = Slugify.slugify(title);
        String candidate = base;
        int suffix = 2;
        while (seriesRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private String uniqueEpisodeSlug(UUID seriesId, String title) {
        String base = Slugify.slugify(title);
        String candidate = base.isBlank() ? "episodio" : base;
        String root = candidate;
        int suffix = 2;
        while (episodeRepository.existsBySeriesIdAndSlug(seriesId, candidate)) {
            candidate = root + "-" + suffix++;
        }
        return candidate;
    }

    private Series saveAndAudit(Series series, String action, UUID actingUserId) {
        Series saved = seriesRepository.save(series);
        audit(action, saved, actingUserId);
        return saved;
    }

    private void audit(String action, Series series, UUID actingUserId) {
        auditService.record(action, AuditResult.SUCCESS, actingUserId, null, "series", series.getId().toString(), null);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
