package pe.plataformacontenidos.galleries;

import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;

/** Publica galerías SCHEDULED cuya fecha ya pasó. Corre cada minuto, igual que EventScheduledPublishJob. */
@Component
public class GalleryScheduledPublishJob {

    private static final Logger log = LoggerFactory.getLogger(GalleryScheduledPublishJob.class);

    private final GalleryRepository galleryRepository;
    private final AuditService auditService;

    public GalleryScheduledPublishJob(GalleryRepository galleryRepository, AuditService auditService) {
        this.galleryRepository = galleryRepository;
        this.auditService = auditService;
    }

    @Scheduled(fixedDelay = 60_000)
    public void publishDueGalleries() {
        List<Gallery> due = galleryRepository.findByStatusAndScheduledAtBefore(GalleryStatus.SCHEDULED, Instant.now());
        for (Gallery gallery : due) {
            gallery.publishFromSchedule();
            galleryRepository.save(gallery);
            auditService.record("GALLERY_PUBLISHED_FROM_SCHEDULE", AuditResult.SUCCESS, null, null,
                    "gallery", gallery.getId().toString(), null);
            log.info("Galería {} publicada automáticamente (programación cumplida)", gallery.getId());
        }
    }
}
