package pe.plataformacontenidos.reviews.api;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.security.UserPrincipal;
import pe.plataformacontenidos.reviews.ReviewService;
import pe.plataformacontenidos.reviews.api.dto.RejectReviewRequest;
import pe.plataformacontenidos.reviews.api.dto.ReviewRequest;
import pe.plataformacontenidos.reviews.api.dto.ReviewResponse;
import pe.plataformacontenidos.reviews.api.dto.ScheduleReviewRequest;

/**
 * CRUD editorial + transiciones de workflow para Reseñas — mismo patrón que
 * EventAdminController. La autorización fina vive en ReviewService.
 */
@RestController
@RequestMapping("/api/v1/admin/reviews")
public class ReviewAdminController {

    private final ReviewService reviewService;

    public ReviewAdminController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<ReviewResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return reviewService.listForAdmin(principal.userId(), principal.role()).stream()
                .map(ReviewResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ReviewResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ReviewResponse.from(reviewService.getForAdmin(id, principal.userId(), principal.role()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(@Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ReviewResponse.from(reviewService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public ReviewResponse update(@PathVariable UUID id, @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ReviewResponse.from(
                reviewService.update(id, request.toInput(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/submit")
    public ReviewResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ReviewResponse.from(reviewService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/approve")
    public ReviewResponse approve(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ReviewResponse.from(reviewService.approve(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/reject")
    public ReviewResponse reject(@PathVariable UUID id, @Valid @RequestBody RejectReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ReviewResponse.from(
                reviewService.reject(id, request.reason(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/publish")
    public ReviewResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ReviewResponse.from(reviewService.publish(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/schedule")
    public ReviewResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ReviewResponse.from(
                reviewService.schedule(id, request.scheduledAt(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/archive")
    public ReviewResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ReviewResponse.from(reviewService.archive(id, principal.userId(), principal.role()));
    }
}
