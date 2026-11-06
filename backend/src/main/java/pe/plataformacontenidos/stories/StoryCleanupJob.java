package pe.plataformacontenidos.stories;

import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.media.ImageInUseException;
import pe.plataformacontenidos.media.ImageNotFoundException;
import pe.plataformacontenidos.media.ImageService;

/**
 * Cada hora borra las historias terminadas hace más de 7 días (las Destacadas
 * no) y luego sus fotos, una por una: si una foto todavía la usa otra
 * historia, se queda y el resto sigue. Así el disco del VPS no crece.
 */
@Component
public class StoryCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(StoryCleanupJob.class);

    private final StoryService stories;
    private final ImageService images;

    public StoryCleanupJob(StoryService stories, ImageService images) {
        this.stories = stories;
        this.images = images;
    }

    @Scheduled(cron = "0 15 * * * *", zone = "${site.time-zone:America/Lima}")
    public void purge() {
        List<UUID> orphanImages = stories.purgeEnded();
        int deletedImages = 0;
        for (UUID imageId : orphanImages) {
            try {
                // Sin actor humano: la tarea borra como gestora (canManageAll).
                images.delete(imageId, null, true);
                deletedImages++;
            } catch (ImageInUseException | ImageNotFoundException e) {
                // Otra historia la usa, o ya no estaba: no es un error de la tarea.
            }
        }
        if (!orphanImages.isEmpty()) {
            log.info("Historias: borradas las terminadas hace más de 7 días; {} fotos borradas", deletedImages);
        }
    }
}
