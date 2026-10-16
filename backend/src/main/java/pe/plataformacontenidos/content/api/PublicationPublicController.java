package pe.plataformacontenidos.content.api;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.content.Publication;
import pe.plataformacontenidos.content.PublicationService;
import pe.plataformacontenidos.content.api.dto.PublicationResponse;
import pe.plataformacontenidos.content.api.dto.PublicationSummaryResponse;
import pe.plataformacontenidos.shared.PageResponse;
import pe.plataformacontenidos.engagement.ContentLikeService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.engagement.LikeResponse;

/** Solo contenido PUBLISHED — nada de estados intermedios visibles públicamente. */
@RestController
@RequestMapping("/api/v1/publications")
public class PublicationPublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final PublicationService publicationService;
    private final ContentLikeService contentLikeService;

    public PublicationPublicController(PublicationService publicationService, ContentLikeService contentLikeService) {
        this.publicationService = publicationService;
        this.contentLikeService = contentLikeService;
    }

    @GetMapping
    public PageResponse<PublicationSummaryResponse> list(
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
        var result = publicationService.listPublished(categoryId, pageable);
        var likes = contentLikeService.countLikes(ContentType.PUBLICATION,
                result.getContent().stream().map(Publication::getId).toList());
        return PageResponse.from(result, item -> PublicationSummaryResponse.from(item, likes.getOrDefault(item.getId(), 0L)));
    }

    @GetMapping("/{slug}")
    public PublicationResponse getBySlug(@PathVariable String slug) {
        Publication publication = publicationService.getPublishedBySlug(slug);
        long likeCount = contentLikeService.countLikes(ContentType.PUBLICATION, publication.getId());
        return PublicationResponse.from(publication, likeCount);
    }

    /** visitorId es un UUID generado y persistido en el navegador del lector (no requiere cuenta) — ver ContentLike. */
    @PostMapping("/{slug}/like")
    public LikeResponse toggleLike(@PathVariable String slug, @RequestParam UUID visitorId) {
        Publication publication = publicationService.getPublishedBySlug(slug);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.PUBLICATION, publication.getId(), visitorId));
    }
}
