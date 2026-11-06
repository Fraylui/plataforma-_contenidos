package pe.plataformacontenidos.series;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;

/**
 * Cada 30 minutos (SERIES_SYNC_MS) revisa la lista de YouTube de cada serie
 * publicada o en borrador y publica los videos nuevos. Una serie a la vez,
 * cada una en su propia transacción: si YouTube falla con una, las demás
 * siguen y el error queda guardado en esa serie.
 */
@Component
public class SeriesSyncJob {

    private static final Logger log = LoggerFactory.getLogger(SeriesSyncJob.class);

    private final SeriesRepository seriesRepository;
    private final SeriesService seriesService;

    public SeriesSyncJob(SeriesRepository seriesRepository, SeriesService seriesService) {
        this.seriesRepository = seriesRepository;
        this.seriesService = seriesService;
    }

    @Scheduled(fixedDelayString = "${series.sync-ms:1800000}", initialDelayString = "${series.sync-ms:1800000}")
    public void syncAll() {
        List<Series> active = seriesRepository.findByStatusIn(
                List.of(PublicationStatus.PUBLISHED, PublicationStatus.DRAFT, PublicationStatus.SCHEDULED));
        int added = 0;
        for (Series series : active) {
            try {
                added += seriesService.sync(series.getId());
            } catch (RuntimeException e) {
                log.warn("No se pudo sincronizar la serie {}: {}", series.getId(), e.getMessage());
            }
        }
        if (added > 0) {
            log.info("Series: {} episodios nuevos desde YouTube", added);
        }
    }
}
