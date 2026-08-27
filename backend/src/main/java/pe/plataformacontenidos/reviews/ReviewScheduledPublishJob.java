package pe.plataformacontenidos.reviews;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;

/** Publica reseñas SCHEDULED cuya fecha ya pasó. Corre cada minuto, igual que EventScheduledPublishJob. */
@Component
public class ReviewScheduledPublishJob {

    private static final Logger log = LoggerFactory.getLogger(ReviewScheduledPublishJob.class);

    private final ReviewRepository reviewRepository;
    private final AuditService auditService;

    public ReviewScheduledPublishJob(ReviewRepository reviewRepository, AuditService auditService) {
        this.reviewRepository = reviewRepository;
        this.auditService = auditService;
    }

    @Scheduled(fixedDelay = 60_000)
    public void publishDueReviews() {
        List<Review> due = reviewRepository.findByStatusAndScheduledAtBefore(ReviewStatus.SCHEDULED, Instant.now());
        for (Review review : due) {
            review.publishFromSchedule();
            reviewRepository.save(review);
            auditService.record("REVIEW_PUBLISHED_FROM_SCHEDULE", AuditResult.SUCCESS, null, null,
                    "review", review.getId().toString(), null);
            log.info("Reseña {} publicada automáticamente (programación cumplida)", review.getId());
        }
    }
}
