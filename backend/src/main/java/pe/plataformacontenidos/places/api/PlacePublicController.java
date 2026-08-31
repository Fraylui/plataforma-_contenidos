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
            @RequestParam(required = false) UUID geographyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(size, MAX_PAGE_SIZE);
        var pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        var result = placeService.listPublished(categoryId, geographyId, pageable);
        return PageResponse.from(result, PlaceSummaryResponse::from);
    }

    @GetMapping("/{slug}")
    public PlaceResponse getBySlug(@PathVariable String slug, @RequestParam(required = false) UUID visitorId) {
        Place place = placeService.getPublishedBySlug(slug);
        long likeCount = contentLikeService.countLikes(ContentType.PLACE, place.getId());
        boolean likedByVisitor = visitorId != null && contentLikeService.isLikedBy(ContentType.PLACE, place.getId(), visitorId);
        return PlaceResponse.from(place, placeService.relatedArticles(place), likeCount, likedByVisitor);
    }

    /** Usado por Events para resolver el nombre/slug de un lugar vinculado (placeId) — ver EventResponse.placeId. */
    @GetMapping("/by-id/{id}")
    public PlaceSummaryResponse getById(@PathVariable UUID id) {
        return PlaceSummaryResponse.from(placeService.getPublishedById(id));
    }

    @PostMapping("/{slug}/like")
    public LikeResponse toggleLike(@PathVariable String slug, @RequestParam UUID visitorId) {
        Place place = placeService.getPublishedBySlug(slug);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.PLACE, place.getId(), visitorId));
    }
}
