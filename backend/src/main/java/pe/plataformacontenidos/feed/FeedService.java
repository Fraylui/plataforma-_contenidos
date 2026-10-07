package pe.plataformacontenidos.feed;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
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
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.directory.BusinessService;
import pe.plataformacontenidos.engagement.ContentLikeService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.events.Event;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.feed.api.dto.FeedItemResponse;
import pe.plataformacontenidos.feed.api.dto.FeedPageResponse;
import pe.plataformacontenidos.feed.api.dto.FeedTopicResponse;
import pe.plataformacontenidos.taxonomy.Category;
import pe.plataformacontenidos.galleries.Gallery;
import pe.plataformacontenidos.galleries.GalleryService;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Feed unificado (Publicaciones, Lugares, Eventos, Galerías y Directorio), pensado para
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
    private final GalleryService galleryService;
    private final BusinessService businessService;
    private final CategoryService categoryService;
    private final ContentLikeService contentLikeService;
    private final FeedCandidateCache candidateCache;

    public FeedService(ArticleService articleService, PlaceService placeService, EventService eventService,
            GalleryService galleryService, BusinessService businessService, CategoryService categoryService,
            ContentLikeService contentLikeService, FeedCandidateCache candidateCache) {
        this.articleService = articleService;
        this.placeService = placeService;
        this.eventService = eventService;
        this.galleryService = galleryService;
        this.businessService = businessService;
        this.categoryService = categoryService;
        this.contentLikeService = contentLikeService;
        this.candidateCache = candidateCache;
    }

    /** Tipos que forman parte del feed (las pestañas del home solo pueden pedir uno de estos). */
    public static final Set<ContentType> FEED_TYPES = Set.of(ContentType.ARTICLE, ContentType.PLACE, ContentType.EVENT,
            ContentType.GALLERY, ContentType.BUSINESS);

    /**
     * {@code type} null = todos los tipos mezclados ("Para ti"); si no, solo
     * ese tipo (pestañas del home). Mismo orden y antirrepetición en ambos
     * casos; con un solo tipo no se consulta a los otros servicios.
     *
     * <p>{@code categoryId}: solo ese tema y sus subtemas (círculos de temas,
     * páginas de tema). {@code upcoming} con {@code type=EVENT}: la Agenda —
     * próximos eventos por fecha de inicio, sin diversificar (en una agenda
     * el orden útil es el cronológico).
     */
    public FeedPageResponse getFeed(int size, List<UUID> excludeIds, String seed, ContentType type, UUID categoryId,
            boolean upcoming) {
        if (type != null && !FEED_TYPES.contains(type)) {
            throw new InvalidFeedTypeException(type);
        }
        Set<UUID> excluded = boundedExcludeSet(excludeIds);
        List<FeedItemResponse> pool = candidateCache.candidates(type, () -> buildCandidates(type)).stream()
                .filter(item -> !excluded.contains(item.id()))
                .toList();
        if (categoryId != null) {
            Set<UUID> topic = categoryService.descendants(categoryId);
            pool = pool.stream().filter(item -> topic.contains(item.categoryId())).toList();
        }
        List<FeedItemResponse> ordered = upcoming && type == ContentType.EVENT
                ? pool.stream().sorted(Comparator.comparing(FeedItemResponse::startsAt,
                        Comparator.nullsLast(Comparator.naturalOrder()))).toList()
                : diversify(pool, seed);

        List<FeedItemResponse> page = ordered.stream().limit(size).toList();
        boolean hasMore = ordered.size() > page.size();
        return new FeedPageResponse(page, hasMore);
    }

    /** Candidatos de un tipo (o de todos) sin filtrar: los mismos para cualquier visitante (ver FeedCandidateCache). */
    private List<FeedItemResponse> buildCandidates(ContentType type) {
        Pageable pageable = PageRequest.of(0, CANDIDATE_POOL_LIMIT, Sort.by(Sort.Direction.DESC, "publishedAt"));
        List<Article> articles = includes(type, ContentType.ARTICLE)
                ? articleService.listPublished(null, pageable).getContent()
                : List.of();
        List<Place> places = includes(type, ContentType.PLACE)
                ? placeService.listPublished(null, pageable).getContent()
                : List.of();
        // Solo próximos: un feed de descubrimiento no debe recomendar eventos que ya pasaron.
        List<Event> events = includes(type, ContentType.EVENT)
                ? eventService.listPublished(null, true, pageable).getContent()
                : List.of();
        List<Gallery> galleries = includes(type, ContentType.GALLERY)
                ? galleryService.listPublished(null, pageable).getContent()
                : List.of();
        List<Business> businesses = includes(type, ContentType.BUSINESS)
                ? businessService.listPublished(null, null, pageable).getContent()
                : List.of();
        return buildPool(articles, places, events, galleries, businesses);
    }

    private static boolean includes(ContentType requested, ContentType candidate) {
        return requested == null || requested == candidate;
    }

    /**
     * "Lo más gustado" (tarjeta de lista del home, como "Historias
     * principales" de MSN): solo contenido con al menos un me gusta real,
     * ordenado por cantidad y, a igualdad, el más nuevo primero. Nunca
     * rellena con contenido sin me gusta — una lista "popular" inventada
     * sería engañosa; si no hay nada gustado, la lista sale vacía y el
     * frontend no la muestra.
     */
    public List<FeedItemResponse> getTopLiked(int size) {
        Pageable pageable = PageRequest.of(0, CANDIDATE_POOL_LIMIT, Sort.by(Sort.Direction.DESC, "publishedAt"));
        List<FeedItemResponse> pool = buildPool(
                articleService.listPublished(null, pageable).getContent(),
                placeService.listPublished(null, pageable).getContent(),
                eventService.listPublished(null, true, pageable).getContent(),
                galleryService.listPublished(null, pageable).getContent(),
                businessService.listPublished(null, null, pageable).getContent());
        return pool.stream()
                .filter(item -> item.likeCount() > 0)
                .sorted(Comparator.comparingLong(FeedItemResponse::likeCount).reversed()
                        .thenComparing(FeedItemResponse::publishedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(Math.max(size, 1))
                .toList();
    }

    /**
     * Círculos de temas del feed: solo temas raíz activos con contenido
     * publicado (propio o de sus subtemas). Orden por actividad de la semana
     * — `publicados_7d + 0.5 · me_gusta_7d` (algoritmo B de CONTEXTO §45.2) —
     * y, a igualdad, por el orden del panel. Portada: la imagen del contenido
     * más reciente que tenga una (cero trabajo de carga para el admin).
     */
    public List<FeedTopicResponse> getTopics() {
        Instant now = Instant.now();
        Instant weekAgo = now.minus(Duration.ofDays(7));
        Instant newSince = now.minus(Duration.ofHours(NEW_TOPIC_HOURS));
        Pageable pageable = PageRequest.of(0, CANDIDATE_POOL_LIMIT, Sort.by(Sort.Direction.DESC, "publishedAt"));
        List<FeedItemResponse> pool = buildPool(
                articleService.listPublished(null, pageable).getContent(),
                placeService.listPublished(null, pageable).getContent(),
                eventService.listPublished(null, true, pageable).getContent(),
                galleryService.listPublished(null, pageable).getContent(),
                businessService.listPublished(null, null, pageable).getContent());

        Map<UUID, Category> byId = new HashMap<>();
        categoryService.listAll().forEach(c -> byId.put(c.getId(), c));
        Map<UUID, List<FeedItemResponse>> byRoot = new LinkedHashMap<>();
        for (FeedItemResponse item : pool) {
            Category root = rootOf(item.categoryId(), byId);
            if (root != null && root.isActive()) {
                byRoot.computeIfAbsent(root.getId(), k -> new ArrayList<>()).add(item);
            }
        }

        Map<UUID, Long> weeklyLikes = weeklyLikes(pool, weekAgo);
        Map<UUID, Double> activity = new HashMap<>();
        byRoot.forEach((rootId, items) -> activity.put(rootId, items.stream()
                .mapToDouble(i -> (isAfter(i.publishedAt(), weekAgo) ? 1 : 0) + 0.5 * weeklyLikes.getOrDefault(i.id(), 0L))
                .sum()));

        return byRoot.entrySet().stream()
                .sorted(Comparator.comparingDouble((Map.Entry<UUID, List<FeedItemResponse>> e) -> activity.get(e.getKey()))
                        .reversed()
                        .thenComparingInt(e -> byId.get(e.getKey()).getSortOrder()))
                .map(e -> toTopic(byId.get(e.getKey()), e.getValue(), newSince))
                .toList();
    }

    private static final int NEW_TOPIC_HOURS = 48;

    private static Category rootOf(UUID categoryId, Map<UUID, Category> byId) {
        Category current = categoryId == null ? null : byId.get(categoryId);
        Set<UUID> seen = new HashSet<>();
        while (current != null && current.getParentId() != null && seen.add(current.getId())) {
            current = byId.get(current.getParentId());
        }
        return current;
    }

    private Map<UUID, Long> weeklyLikes(List<FeedItemResponse> pool, Instant since) {
        Map<UUID, Long> likes = new HashMap<>();
        for (ContentType type : FEED_TYPES) {
            List<UUID> ids = pool.stream().filter(i -> i.type() == type).map(FeedItemResponse::id).toList();
            likes.putAll(contentLikeService.countLikesSince(type, ids, since));
        }
        return likes;
    }

    private static boolean isAfter(Instant instant, Instant threshold) {
        return instant != null && instant.isAfter(threshold);
    }

    private static FeedTopicResponse toTopic(Category category, List<FeedItemResponse> items, Instant newSince) {
        Comparator<FeedItemResponse> newestFirst = Comparator.comparing(FeedItemResponse::publishedAt,
                Comparator.nullsLast(Comparator.reverseOrder()));
        FeedItemResponse cover = items.stream()
                .filter(i -> i.coverImageId() != null || i.coverImageUrl() != null)
                .sorted(newestFirst)
                .findFirst()
                .orElse(null);
        boolean hasNew = items.stream().anyMatch(i -> isAfter(i.publishedAt(), newSince));
        return new FeedTopicResponse(category.getId(), category.getName(), category.getSlug(),
                cover == null ? null : cover.coverImageId(), cover == null ? null : cover.coverImageUrl(), hasNew);
    }

    /**
     * Relacionados para la vista de detalle: misma categoría, filtrado por
     * DB. Deliberadamente mezcla los 3 tipos de contenido en vez de
     * devolver solo el mismo tipo — el objetivo es que quien lee una
     * Publicación descubra también Lugares/Eventos relacionados, no quedarse
     * encerrado en un solo módulo.
     */
    public List<FeedItemResponse> getRelated(ContentType excludeType, UUID excludeId, UUID categoryId, int size) {
        if (categoryId == null) {
            return List.of();
        }
        Pageable pageable = PageRequest.of(0, RELATED_POOL_LIMIT, Sort.by(Sort.Direction.DESC, "publishedAt"));

        List<Article> articles = articleService.listPublished(categoryId, pageable).getContent();
        List<Place> places = placeService.listPublished(categoryId, pageable).getContent();
        List<Event> events = eventService.listPublished(categoryId, true, pageable).getContent();
        List<Gallery> galleries = galleryService.listPublished(categoryId, pageable).getContent();
        List<Business> businesses = businessService.listPublished(categoryId, null, pageable).getContent();

        List<FeedItemResponse> pool = buildPool(articles, places, events, galleries, businesses).stream()
                .filter(item -> !(item.type() == excludeType && item.id().equals(excludeId)))
                .toList();

        Instant now = Instant.now();
        return pool.stream()
                .sorted(Comparator.comparingDouble((FeedItemResponse item) -> relatedScore(item, now)).reversed())
                .limit(Math.max(size, 1))
                .toList();
    }

    private List<FeedItemResponse> buildPool(List<Article> articles, List<Place> places, List<Event> events,
            List<Gallery> galleries, List<Business> businesses) {
        Map<UUID, Long> articleLikes = contentLikeService.countLikes(ContentType.ARTICLE,
                articles.stream().map(Article::getId).toList());
        Map<UUID, Long> placeLikes = contentLikeService.countLikes(ContentType.PLACE,
                places.stream().map(Place::getId).toList());
        Map<UUID, Long> eventLikes = contentLikeService.countLikes(ContentType.EVENT,
                events.stream().map(Event::getId).toList());
        Map<UUID, Long> galleryLikes = contentLikeService.countLikes(ContentType.GALLERY,
                galleries.stream().map(Gallery::getId).toList());
        Map<UUID, Long> businessLikes = contentLikeService.countLikes(ContentType.BUSINESS,
                businesses.stream().map(Business::getId).toList());

        List<FeedItemResponse> pool = new ArrayList<>(
                articles.size() + places.size() + events.size() + galleries.size() + businesses.size());
        articles.forEach(a -> pool.add(FeedItemResponse.fromArticle(a, articleLikes.getOrDefault(a.getId(), 0L))));
        places.forEach(p -> pool.add(FeedItemResponse.fromPlace(p, placeLikes.getOrDefault(p.getId(), 0L))));
        events.forEach(e -> pool.add(FeedItemResponse.fromEvent(e, eventLikes.getOrDefault(e.getId(), 0L))));
        galleries.forEach(g -> pool.add(FeedItemResponse.fromGallery(g, galleryLikes.getOrDefault(g.getId(), 0L))));
        businesses.forEach(b -> pool.add(FeedItemResponse.fromBusiness(b, businessLikes.getOrDefault(b.getId(), 0L))));
        return pool;
    }

    /** Frescura + likes. `log1p` para que las interacciones pesen pero un solo ítem viral no eclipse todo lo demás. */
    private double relatedScore(FeedItemResponse item, Instant now) {
        double score = freshness(item.publishedAt(), now);
        score += Math.log1p(item.likeCount()) * 0.3;
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
        return freshness(item.publishedAt(), now) * 0.55 + popularity(item.likeCount()) * 0.2
                + seededJitter(item.id(), seed) * 0.25;
    }

    private double freshness(Instant publishedAt, Instant now) {
        if (publishedAt == null) {
            return 0;
        }
        double ageDays = Duration.between(publishedAt, now).toHours() / 24.0;
        return 1.0 / (1.0 + Math.max(ageDays, 0));
    }

    /**
     * Interacción como señal de descubrimiento, no solo frescura — pedido
     * explícito: que lo más publicado no sea la única forma de aparecer
     * arriba, que también cuente lo que la gente ya está likeando. Acotada
     * en [0,1) (satura acercándose a 1) para que un solo ítem viral no
     * eclipse el resto del feed ni rompa la diversificación por categoría.
     */
    private double popularity(long likeCount) {
        return likeCount / (double) (likeCount + 10);
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
