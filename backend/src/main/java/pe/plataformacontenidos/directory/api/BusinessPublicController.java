package pe.plataformacontenidos.directory.api;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.directory.Business;
import pe.plataformacontenidos.directory.BusinessService;
import pe.plataformacontenidos.directory.BusinessType;
import pe.plataformacontenidos.directory.api.dto.BusinessResponse;
import pe.plataformacontenidos.directory.api.dto.BusinessSummaryResponse;
import pe.plataformacontenidos.directory.api.dto.PageResponse;
import pe.plataformacontenidos.engagement.ContentLikeService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.engagement.LikeResponse;

/** Solo contenido PUBLISHED — nada de estados intermedios visibles públicamente. */
@RestController
@RequestMapping("/api/v1/directory")
public class BusinessPublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final BusinessService businessService;
    private final ContentLikeService contentLikeService;

    public BusinessPublicController(BusinessService businessService, ContentLikeService contentLikeService) {
        this.businessService = businessService;
        this.contentLikeService = contentLikeService;
    }

    @GetMapping
    public PageResponse<BusinessSummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID geographyId,
            @RequestParam(required = false) BusinessType businessType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Clamp defensivo: page<0/size<1 lanzan IllegalArgumentException, y un page
        // extremo hace que offset (page*size) desborde Integer.MAX_VALUE en el
        // driver JDBC (InvalidDataAccessApiUsageException) — ambos son 500 en un
        // endpoint público sin autenticar. Ver ApiHardeningIntegrationTest.
        int safePage = Math.min(Math.max(page, 0), 10_000_000);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        var result = businessService.listPublished(categoryId, geographyId, businessType, pageable);
        var likes = contentLikeService.countLikes(ContentType.BUSINESS,
                result.getContent().stream().map(Business::getId).toList());
        return PageResponse.from(result, item -> BusinessSummaryResponse.from(item, likes.getOrDefault(item.getId(), 0L)));
    }

    @GetMapping("/{slug}")
    public BusinessResponse getBySlug(@PathVariable String slug) {
        Business business = businessService.getPublishedBySlug(slug);
        long likeCount = contentLikeService.countLikes(ContentType.BUSINESS, business.getId());
        return BusinessResponse.from(business, likeCount);
    }

    @PostMapping("/{slug}/like")
    public LikeResponse toggleLike(@PathVariable String slug, @RequestParam UUID visitorId) {
        Business business = businessService.getPublishedBySlug(slug);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.BUSINESS, business.getId(), visitorId));
    }
}
