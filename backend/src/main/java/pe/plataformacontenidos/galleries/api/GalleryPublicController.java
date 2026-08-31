package pe.plataformacontenidos.galleries.api;

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
import pe.plataformacontenidos.galleries.Gallery;
import pe.plataformacontenidos.galleries.GalleryService;
import pe.plataformacontenidos.galleries.api.dto.GalleryResponse;
import pe.plataformacontenidos.galleries.api.dto.GallerySummaryResponse;
import pe.plataformacontenidos.galleries.api.dto.PageResponse;

/** Solo contenido PUBLISHED — nada de estados intermedios visibles públicamente. */
@RestController
@RequestMapping("/api/v1/galleries")
public class GalleryPublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final GalleryService galleryService;
    private final ContentLikeService contentLikeService;

    public GalleryPublicController(GalleryService galleryService, ContentLikeService contentLikeService) {
        this.galleryService = galleryService;
        this.contentLikeService = contentLikeService;
    }

    @GetMapping
    public PageResponse<GallerySummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID geographyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(size, MAX_PAGE_SIZE);
        var pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        var result = galleryService.listPublished(categoryId, geographyId, pageable);
        return PageResponse.from(result, GallerySummaryResponse::from);
    }

    @GetMapping("/{slug}")
    public GalleryResponse getBySlug(@PathVariable String slug, @RequestParam(required = false) UUID visitorId) {
        Gallery gallery = galleryService.getPublishedBySlug(slug);
        long likeCount = contentLikeService.countLikes(ContentType.GALLERY, gallery.getId());
        boolean likedByVisitor = visitorId != null && contentLikeService.isLikedBy(ContentType.GALLERY, gallery.getId(), visitorId);
        return GalleryResponse.from(gallery, likeCount, likedByVisitor);
    }

    @PostMapping("/{slug}/like")
    public LikeResponse toggleLike(@PathVariable String slug, @RequestParam UUID visitorId) {
        Gallery gallery = galleryService.getPublishedBySlug(slug);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.GALLERY, gallery.getId(), visitorId));
    }
}
