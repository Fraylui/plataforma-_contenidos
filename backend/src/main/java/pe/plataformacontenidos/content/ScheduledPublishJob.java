package pe.plataformacontenidos.content;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;

/** Publica artículos SCHEDULED cuya fecha ya pasó. Corre cada minuto: es intencionalmente barato para el MVP. */
@Component
public class ScheduledPublishJob {

    private static final Logger log = LoggerFactory.getLogger(ScheduledPublishJob.class);

    private final ArticleRepository articleRepository;
    private final AuditService auditService;

    public ScheduledPublishJob(ArticleRepository articleRepository, AuditService auditService) {
        this.articleRepository = articleRepository;
        this.auditService = auditService;
    }

    @Scheduled(fixedDelay = 60_000)
    public void publishDueArticles() {
        List<Article> due = articleRepository.findByStatusAndScheduledAtBefore(ArticleStatus.SCHEDULED, Instant.now());
        for (Article article : due) {
            article.publishFromSchedule();
            articleRepository.save(article);
            auditService.record("ARTICLE_PUBLISHED_FROM_SCHEDULE", AuditResult.SUCCESS, null, null,
                    "article", article.getId().toString(), null);
            log.info("Artículo {} publicado automáticamente (programación cumplida)", article.getId());
        }
    }
}
