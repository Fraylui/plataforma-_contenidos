package pe.plataformacontenidos.reviews.api;

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
import pe.plataformacontenidos.reviews.Review;
import pe.plataformacontenidos.reviews.ReviewService;
import pe.plataformacontenidos.reviews.api.dto.PageResponse;
import pe.plataformacontenidos.reviews.api.dto.ReviewResponse;
import pe.plataformacontenidos.reviews.api.dto.ReviewSummaryResponse;

/** Solo contenido PUBLISHED — nada de estados intermedios visibles públicamente. */
@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewPublicController {

    private static final int MAX_PAGE_SIZE = 50;

    private final ReviewService reviewService;
    private final ContentLikeService contentLikeService;

    public ReviewPublicController(ReviewService reviewService, ContentLikeService contentLikeService) {
        this.reviewService = reviewService;
        this.contentLikeService = contentLikeService;
    }

    @GetMapping
    public PageResponse<ReviewSummaryResponse> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID geographyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(size, MAX_PAGE_SIZE);
        var pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.DESC, "publishedAt"));
        var result = reviewService.listPublished(categoryId, geographyId, pageable);
        return PageResponse.from(result, ReviewSummaryResponse::from);
    }

    @GetMapping("/{slug}")
    public ReviewResponse getBySlug(@PathVariable String slug) {
        Review review = reviewService.getPublishedBySlug(slug);
        long likeCount = contentLikeService.countLikes(ContentType.REVIEW, review.getId());
        return ReviewResponse.from(review, likeCount);
    }

    @PostMapping("/{slug}/like")
    public LikeResponse toggleLike(@PathVariable String slug, @RequestParam UUID visitorId) {
        Review review = reviewService.getPublishedBySlug(slug);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.REVIEW, review.getId(), visitorId));
    }
}
