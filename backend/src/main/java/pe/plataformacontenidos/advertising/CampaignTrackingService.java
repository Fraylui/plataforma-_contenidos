package pe.plataformacontenidos.advertising;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.shared.InvalidTraffic;

/**
 * Lo que mide una campaña: <b>impresión visible</b> (la informa el navegador
 * cuando al menos la mitad del anuncio estuvo un segundo en pantalla, estándar
 * MRC/IAB), <b>clic válido</b> (sin robots ni repeticiones; el visitante
 * siempre llega al destino) y <b>reproducción</b> del video de un nativo.
 * Totales en la campaña y por día (UTC) en CampaignDailyStat.
 */
@Service
@Transactional
public class CampaignTrackingService {

    private final CampaignRepository campaignRepository;
    private final CampaignDailyStatRepository dailyStatRepository;
    private final AdDeliveryGuard deliveryGuard;

    public CampaignTrackingService(CampaignRepository campaignRepository,
            CampaignDailyStatRepository dailyStatRepository, AdDeliveryGuard deliveryGuard) {
        this.campaignRepository = campaignRepository;
        this.dailyStatRepository = dailyStatRepository;
        this.deliveryGuard = deliveryGuard;
    }

    /** Impresión visible informada por el navegador. Robots, duplicados y campañas no vigentes no cuentan. */
    public void recordImpression(UUID id, String clientIp, String userAgent) {
        if (InvalidTraffic.isAutomated(userAgent)) {
            return;
        }
        Optional<Campaign> campaign = campaignRepository.findById(id);
        if (campaign.isEmpty() || !campaign.get().isCurrentlyServable(Instant.now())) {
            return;
        }
        if (deliveryGuard.acceptImpression(AdDeliveryGuard.visitorKey(clientIp), id)) {
            campaignRepository.incrementImpressions(id);
            dailyStatRepository.add(id, today(), 1, 0, 0);
        }
    }

    /** Devuelve a dónde redirigir — siempre; el clic solo se cuenta si es válido. El link real nunca va en el HTML. */
    public String recordClickAndGetLinkUrl(UUID id, String clientIp, String userAgent) {
        Campaign campaign = campaignRepository.findById(id).orElseThrow(() -> new CampaignNotFoundException(id));
        if (!InvalidTraffic.isAutomated(userAgent)
                && deliveryGuard.acceptClick(AdDeliveryGuard.visitorKey(clientIp), id)) {
            campaignRepository.incrementClicks(id);
            dailyStatRepository.add(id, today(), 0, 1, 0);
        }
        return campaign.getLinkUrl();
    }

    /** El visitante tocó play en el video de un anuncio nativo. Robots, repeticiones y no vigentes no cuentan. */
    public void recordPlay(UUID id, String clientIp, String userAgent) {
        if (InvalidTraffic.isAutomated(userAgent)) {
            return;
        }
        Optional<Campaign> campaign = campaignRepository.findById(id);
        boolean playable = campaign.map(c -> c.isCurrentlyServable(Instant.now()) && c.getNativeAd() != null
                && c.getNativeAd().youtubeVideoId() != null).orElse(false);
        if (playable && deliveryGuard.acceptPlay(AdDeliveryGuard.visitorKey(clientIp), id)) {
            campaignRepository.incrementPlays(id);
            dailyStatRepository.add(id, today(), 0, 0, 1);
        }
    }

    @Transactional(readOnly = true)
    public List<CampaignDailyStat> dailyStats(UUID id, int days) {
        if (!campaignRepository.existsById(id)) {
            throw new CampaignNotFoundException(id);
        }
        return dailyStatRepository.findByCampaignIdAndDayGreaterThanEqualOrderByDayAsc(id, today().minusDays(days - 1L));
    }

    private static LocalDate today() {
        return LocalDate.now(ZoneOffset.UTC);
    }
}
