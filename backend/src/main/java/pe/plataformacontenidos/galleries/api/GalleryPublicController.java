package pe.plataformacontenidos.galleries.api;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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

    public GalleryPublicController(GalleryService galleryService) {
        this.galleryService = galleryService;
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
    public GalleryResponse getBySlug(@PathVariable String slug) {
        Gallery gallery = galleryService.getPublishedBySlug(slug);
        return GalleryResponse.from(gallery);
    }
}
