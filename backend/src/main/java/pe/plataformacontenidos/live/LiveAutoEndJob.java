package pe.plataformacontenidos.live;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Cada 10 minutos termina la transmisión que alguien olvidó cerrar (más de
 * 12 horas en vivo), para que el inicio no anuncie "En vivo ahora" sobre
 * algo que ya acabó.
 */
@Component
public class LiveAutoEndJob {

    private static final Logger log = LoggerFactory.getLogger(LiveAutoEndJob.class);

    private final LiveStreamService liveStreamService;

    public LiveAutoEndJob(LiveStreamService liveStreamService) {
        this.liveStreamService = liveStreamService;
    }

    @Scheduled(fixedDelayString = "${live.auto-end-check-ms:600000}", initialDelayString = "${live.auto-end-check-ms:600000}")
    public void endForgotten() {
        int ended = liveStreamService.endForgotten();
        if (ended > 0) {
            log.info("En vivo: {} transmisiones terminadas automáticamente tras 12 horas", ended);
        }
    }
}
