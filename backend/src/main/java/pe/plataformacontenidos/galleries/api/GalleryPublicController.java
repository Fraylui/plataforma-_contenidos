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
        // Clamp defensivo: page<0/size<1 lanzan IllegalArgumentException, y un page
        // extremo hace que offset (page*size) desborde Integer.MAX_VALUE en el
        // driver JDBC (InvalidDataAccessApiUsageException) — ambos son 500 en un
        // endpoint público sin autenticar. Ver ApiHardeningIntegrationTest.
        int safePage = Math.min(Math.max(page, 0), 10_000_000);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        var result = galleryService.listPublished(categoryId, geographyId, pageable);
        var likes = contentLikeService.countLikes(ContentType.GALLERY,
                result.getContent().stream().map(Gallery::getId).toList());
        return PageResponse.from(result, item -> GallerySummaryResponse.from(item, likes.getOrDefault(item.getId(), 0L)));
    }

    @GetMapping("/{slug}")
    public GalleryResponse getBySlug(@PathVariable String slug) {
        Gallery gallery = galleryService.getPublishedBySlug(slug);
        long likeCount = contentLikeService.countLikes(ContentType.GALLERY, gallery.getId());
        return GalleryResponse.from(gallery, likeCount);
    }

    @PostMapping("/{slug}/like")
    public LikeResponse toggleLike(@PathVariable String slug, @RequestParam UUID visitorId) {
        Gallery gallery = galleryService.getPublishedBySlug(slug);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.GALLERY, gallery.getId(), visitorId));
    }
}
