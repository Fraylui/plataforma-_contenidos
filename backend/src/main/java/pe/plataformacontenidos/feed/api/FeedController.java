package pe.plataformacontenidos.feed.api;

import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.feed.FeedService;
import pe.plataformacontenidos.feed.api.dto.FeedItemResponse;
import pe.plataformacontenidos.feed.api.dto.FeedPageResponse;

/**
 * Feed unificado del home y contenido relacionado de la vista de detalle
 * (recomendación de home/algoritmo de descubrimiento). Solo contenido
 * PUBLISHED — mismo criterio que el resto de los controladores públicos.
 */
@RestController
@RequestMapping("/api/v1/feed")
public class FeedController {

    private static final int MAX_PAGE_SIZE = 30;
    private static final int MAX_RELATED_SIZE = 20;

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    /**
     * `exclude` lleva los IDs que el cliente ya mostró en esta sesión de
     * scroll (acotado del lado del cliente); `seed` es un valor estable por
     * sesión de scroll (p. ej. generado una vez al cargar el home) que hace
     * reproducible el orden de una página a la siguiente sin necesitar
     * estado en el servidor.
     */
    @GetMapping
    public FeedPageResponse getFeed(
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) List<UUID> exclude,
            @RequestParam(required = false) String seed) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return feedService.getFeed(safeSize, exclude, seed);
    }

    /**
     * `categoryId` viene del propio recurso que el frontend ya está
     * mostrando (no hace falta otra consulta al servidor para resolverlo) —
     * ver ArticleResponse/PlaceResponse/EventResponse.
     */
    @GetMapping("/related")
    public List<FeedItemResponse> getRelated(
            @RequestParam ContentType excludeType,
            @RequestParam UUID excludeId,
            @RequestParam UUID categoryId,
            @RequestParam(defaultValue = "6") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_RELATED_SIZE);
        return feedService.getRelated(excludeType, excludeId, categoryId, safeSize);
    }
}
