package pe.plataformacontenidos.feed;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.directory.BusinessService;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.galleries.GalleryService;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.taxonomy.Category;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Qué temas tienen contenido publicado (regla del dueño: lo que no tiene
 * contenido no aparece hasta que lo tenga — CONTEXTO.md 43.5). Mismo
 * principio que FeedService/SearchService: se agrega en memoria llamando a
 * cada módulo, sin joins entre esquemas.
 */
@Service
public class CategoryPresenceService {

    private final CategoryService categoryService;
    private final ArticleService articleService;
    private final PlaceService placeService;
    private final EventService eventService;
    private final GalleryService galleryService;
    private final BusinessService businessService;

    public CategoryPresenceService(CategoryService categoryService, ArticleService articleService,
            PlaceService placeService, EventService eventService, GalleryService galleryService,
            BusinessService businessService) {
        this.categoryService = categoryService;
        this.articleService = articleService;
        this.placeService = placeService;
        this.eventService = eventService;
        this.galleryService = galleryService;
        this.businessService = businessService;
    }

    /** Temas activos con contenido publicado propio o en alguno de sus subtemas. */
    public Set<UUID> activeCategoryIdsWithContent() {
        Set<UUID> withContent = new HashSet<>();
        withContent.addAll(articleService.publishedCategoryIds());
        withContent.addAll(placeService.publishedCategoryIds());
        withContent.addAll(eventService.publishedCategoryIds());
        withContent.addAll(galleryService.publishedCategoryIds());
        withContent.addAll(businessService.publishedCategoryIds());
        return withAncestors(withContent, categoryService.listActive());
    }

    /**
     * Suma los temas padre de cada tema con contenido (un tema padre sin
     * contenido propio pero con un subtema lleno sí se muestra). Solo
     * devuelve temas activos: si un padre está inactivo, la cadena se corta
     * ahí. Tolera ciclos por si un dato viejo los tuviera.
     */
    static Set<UUID> withAncestors(Set<UUID> withContent, List<Category> activeCategories) {
        Map<UUID, UUID> parentOf = new HashMap<>();
        for (Category category : activeCategories) {
            parentOf.put(category.getId(), category.getParentId());
        }
        Set<UUID> result = new HashSet<>();
        for (UUID id : withContent) {
            UUID current = id;
            while (current != null && parentOf.containsKey(current) && result.add(current)) {
                current = parentOf.get(current);
            }
        }
        return result;
    }
}
