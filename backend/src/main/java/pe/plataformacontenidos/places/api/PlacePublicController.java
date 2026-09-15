package pe.plataformacontenidos.places.api;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.engagement.ContentLikeService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.engagement.LikeResponse;
import pe.plataformacontenidos.places.Place;
import pe.plataformacontenidos.places.PlaceService;
import pe.plataformacontenidos.places.api.dto.PageResponse;
import pe.plataformacontenidos.places.api.dto.PlaceResponse;
import pe.plataformacontenidos.places.api.dto.PlaceSummaryResponse;

/** Solo contenido PUBLISHED — nada de estados intermedios visibles públicamente. */
@RestController
@RequestMapping("/api/v1/places")
public class PlacePublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final PlaceService placeService;
    private final ContentLikeService contentLikeService;

    public PlacePublicController(PlaceService placeService, ContentLikeService contentLikeService) {
        this.placeService = placeService;
        this.contentLikeService = contentLikeService;
    }

    @GetMapping
    public PageResponse<PlaceSummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Clamp defensivo: page<0/size<1 lanzan IllegalArgumentException, y un page
        // extremo hace que offset (page*size) desborde Integer.MAX_VALUE en el
        // driver JDBC (InvalidDataAccessApiUsageException) — ambos son 500 en un
        // endpoint público sin autenticar. Ver ApiHardeningIntegrationTest.
        int safePage = Math.min(Math.max(page, 0), 10_000_000);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        var result = placeService.listPublished(categoryId, pageable);
        var likes = contentLikeService.countLikes(ContentType.PLACE,
                result.getContent().stream().map(Place::getId).toList());
        return PageResponse.from(result, item -> PlaceSummaryResponse.from(item, likes.getOrDefault(item.getId(), 0L)));
    }

    @GetMapping("/{slug}")
    public PlaceResponse getBySlug(@PathVariable String slug) {
        Place place = placeService.getPublishedBySlug(slug);
        long likeCount = contentLikeService.countLikes(ContentType.PLACE, place.getId());
        return PlaceResponse.from(place, likeCount);
    }

    /** Usado por Events para resolver el nombre/slug de un lugar vinculado (placeId) — ver EventResponse.placeId. */
    @GetMapping("/by-id/{id}")
    public PlaceSummaryResponse getById(@PathVariable UUID id) {
        Place place = placeService.getPublishedById(id);
        return PlaceSummaryResponse.from(place, contentLikeService.countLikes(ContentType.PLACE, place.getId()));
    }

    @PostMapping("/{slug}/like")
    public LikeResponse toggleLike(@PathVariable String slug, @RequestParam UUID visitorId) {
        Place place = placeService.getPublishedBySlug(slug);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.PLACE, place.getId(), visitorId));
    }
}
