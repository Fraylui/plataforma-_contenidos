package pe.plataformacontenidos.feed;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.engagement.ContentLikeService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.feed.api.dto.FeedItemResponse;
import pe.plataformacontenidos.feed.api.dto.FeedPageResponse;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.places.PlaceService;

/**
 * Feed unificado del home (Publicaciones + Lugares + Eventos), pensado para
 * scroll infinito sin repetir contenido y sin que un solo tipo/categoría
 * domine la vista. Mismo principio arquitectónico que search.SearchService
 * (CONTEXTO.md sección 16 y 38): se agrega en memoria llamando a los
 * servicios de cada módulo, nunca con un join SQL entre esquemas.
 *
 * <p>No hay "cursor" con estado en el servidor ni recomendación por
 * IA/ML: a la escala actual del catálogo eso sería sobre-ingeniería (ver
 * también SearchService.MERGE_FETCH_LIMIT). El cliente es quien lleva el
 * estado de "qué ya vi" (excludeIds, acotado) y en cada llamada se recalcula
 * el orden completo excluyendo esos IDs — más simple y más honesto que
 * fingir paginación estable sobre un orden que de todos modos se
 * recalcularía distinto apenas se publique contenido nuevo.
 */
@Service
public class FeedService {

    // Techo de candidatos por tipo antes de mezclar (mismo criterio que
    // SearchService.MERGE_FETCH_LIMIT): si esto se vuelve cuello de botella,
    // la señal es un motor de búsqueda/recomendación real, no optimizar esto.
    private static final int CANDIDATE_POOL_LIMIT = 200;
    private static final int RELATED_POOL_LIMIT = 40;
    // Techo defensivo de excludeIds que acepta un request (OWASP A05 —
    // evita que un cliente hostil fuerce un IN (...) o un filtrado en
    // memoria de tamaño arbitrario).
    private static final int MAX_EXCLUDE_IDS = 300;

    private final ArticleService articleService;
    private final PlaceService placeService;
    private final EventService eventService;
    private final ContentLikeService contentLikeService;

    public FeedService(ArticleService articleService, PlaceService placeService, EventService eventService,
            ContentLikeService contentLikeService) {
        this.articleService = articleService;
        this.placeService = placeService;
        this.eventService = eventService;
        this.contentLikeService = contentLikeService;
    }

    public FeedPageResponse getFeed(int size, List<UUID> excludeIds, String seed) {
        Set<UUID> excluded = boundedExcludeSet(excludeIds);
        Pageable pageable = PageRequest.of(0, CANDIDATE_POOL_LIMIT, Sort.by(Sort.Direction.DESC, "publishedAt"));

        List<Article> articles = articleService.listPublished(null, null, pageable).getContent().stream()
                .filter(a -> !excluded.contains(a.getId())).toList();
        List<Place> places = placeService.listPublished(null, null, pageable).getContent().stream()
                .filter(p -> !excluded.contains(p.getId())).toList();
        // Solo próximos: un feed de descubrimiento no debe recomendar eventos que ya pasaron.
        List<Event> events = eventService.listPublished(null, null, true, pageable).getContent().stream()
                .filter(e -> !excluded.contains(e.getId())).toList();

        List<FeedItemResponse> pool = buildPool(articles, places, events);
        List<FeedItemResponse> ordered = diversify(pool, seed);

        List<FeedItemResponse> page = ordered.stream().limit(size).toList();
        boolean hasMore = ordered.size() > page.size();
        return new FeedPageResponse(page, hasMore);
    }

    /**
     * Relacionados para la vista de detalle: misma categoría (filtrado por
     * DB, igual que PlaceService.relatedArticles ya hacía solo con
     * geografía) y, dentro de eso, se prioriza compartir también la
     * geografía. Deliberadamente mezcla los 3 tipos de contenido en vez de
     * devolver solo el mismo tipo — el objetivo es que quien lee una
     * Publicación descubra también Lugares/Eventos relacionados, no quedarse
     * encerrado en un solo módulo.
     */
    public List<FeedItemResponse> getRelated(ContentType excludeType, UUID excludeId, UUID categoryId,
            UUID geographyId, int size) {
        if (categoryId == null) {
            return List.of();
        }
        Pageable pageable = PageRequest.of(0, RELATED_POOL_LIMIT, Sort.by(Sort.Direction.DESC, "publishedAt"));

        List<Article> articles = articleService.listPublished(categoryId, null, pageable).getContent();
        List<Place> places = placeService.listPublished(categoryId, null, pageable).getContent();
        List<Event> events = eventService.listPublished(categoryId, null, true, pageable).getContent();

        List<FeedItemResponse> pool = buildPool(articles, places, events).stream()
                .filter(item -> !(item.type() == excludeType && item.id().equals(excludeId)))
                .toList();

        Instant now = Instant.now();
        return pool.stream()
                .sorted(Comparator.comparingDouble((FeedItemResponse item) -> relatedScore(item, geographyId, now))
                        .reversed())
                .limit(Math.max(size, 1))
                .toList();
    }

    private List<FeedItemResponse> buildPool(List<Article> articles, List<Place> places, List<Event> events) {
        Map<UUID, Long> articleLikes = contentLikeService.countLikes(ContentType.ARTICLE,
                articles.stream().map(Article::getId).toList());
        Map<UUID, Long> placeLikes = contentLikeService.countLikes(ContentType.PLACE,
                places.stream().map(Place::getId).toList());
        Map<UUID, Long> eventLikes = contentLikeService.countLikes(ContentType.EVENT,
                events.stream().map(Event::getId).toList());

        List<FeedItemResponse> pool = new ArrayList<>(articles.size() + places.size() + events.size());
        articles.forEach(a -> pool.add(FeedItemResponse.fromArticle(a, articleLikes.getOrDefault(a.getId(), 0L))));
        places.forEach(p -> pool.add(FeedItemResponse.fromPlace(p, placeLikes.getOrDefault(p.getId(), 0L))));
        events.forEach(e -> pool.add(FeedItemResponse.fromEvent(e, eventLikes.getOrDefault(e.getId(), 0L))));
        return pool;
    }

    private double relatedScore(FeedItemResponse item, UUID geographyId, Instant now) {
        double score = 0;
        if (geographyId != null && geographyId.equals(item.geographyId())) {
            score += 2;
        }
        score += freshness(item.publishedAt(), now);
        return score;
    }

    /**
     * Antirrepetición y variedad: agrupa por categoría y hace un round-robin
     * tomando primero de la categoría con más elementos restantes, así dos
     * ítems seguidos casi nunca comparten categoría (salvo que una sola
     * categoría concentre más de la mitad del contenido disponible, caso en
     * el que es matemáticamente inevitable). Dentro de cada categoría se
     * ordena por frescura + un jitter determinado por `seed`, para que la
     * misma sesión no vea siempre el mismo orden pero sí uno reproducible
     * si repite la llamada con el mismo seed y los mismos excludeIds.
     */
    private List<FeedItemResponse> diversify(List<FeedItemResponse> pool, String seed) {
        if (pool.isEmpty()) {
            return List.of();
        }
        Instant now = Instant.now();
        Map<UUID, List<FeedItemResponse>> byCategory = new LinkedHashMap<>();
        UUID noCategory = new UUID(0, 0);
        for (FeedItemResponse item : pool) {
            UUID key = item.categoryId() == null ? noCategory : item.categoryId();
            byCategory.computeIfAbsent(key, k -> new ArrayList<>()).add(item);
        }
        for (List<FeedItemResponse> bucket : byCategory.values()) {
            bucket.sort(Comparator.comparingDouble((FeedItemResponse it) -> score(it, now, seed)).reversed());
        }

        List<FeedItemResponse> result = new ArrayList<>(pool.size());
        List<List<FeedItemResponse>> buckets = new ArrayList<>(byCategory.values());
        while (result.size() < pool.size()) {
            buckets.sort(Comparator.comparingInt(List<FeedItemResponse>::size).reversed());
            for (List<FeedItemResponse> bucket : buckets) {
                if (!bucket.isEmpty()) {
                    result.add(bucket.remove(0));
                }
            }
        }
        return result;
    }

    private double score(FeedItemResponse item, Instant now, String seed) {
        return freshness(item.publishedAt(), now) * 0.7 + seededJitter(item.id(), seed) * 0.3;
    }

    private double freshness(Instant publishedAt, Instant now) {
        if (publishedAt == null) {
            return 0;
        }
        double ageDays = Duration.between(publishedAt, now).toHours() / 24.0;
        return 1.0 / (1.0 + Math.max(ageDays, 0));
    }

    /** Jitter pseudoaleatorio pero determinístico en [0,1) — mismo seed + mismo id siempre da el mismo valor. */
    private double seededJitter(UUID id, String seed) {
        String base = (seed == null ? "" : seed) + ":" + id;
        int hash = base.hashCode() & 0x7fffffff;
        return hash / (double) Integer.MAX_VALUE;
    }

    /** Se queda con los últimos vistos (no los primeros): el cliente reenvía la lista completa en orden de aparición. */
    private Set<UUID> boundedExcludeSet(List<UUID> excludeIds) {
        if (excludeIds == null || excludeIds.isEmpty()) {
            return Set.of();
        }
        int limit = Math.min(excludeIds.size(), MAX_EXCLUDE_IDS);
        return new HashSet<>(excludeIds.subList(excludeIds.size() - limit, excludeIds.size()));
    }
}
