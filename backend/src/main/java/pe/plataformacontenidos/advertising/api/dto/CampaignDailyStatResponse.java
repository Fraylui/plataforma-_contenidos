package pe.plataformacontenidos.advertising.api.dto;

import java.time.LocalDate;
import pe.plataformacontenidos.advertising.CampaignDailyStat;

public record CampaignDailyStatResponse(LocalDate day, long impressions, long clicks) {

    public static CampaignDailyStatResponse from(CampaignDailyStat stat) {
        return new CampaignDailyStatResponse(stat.getDay(), stat.getImpressions(), stat.getClicks());
    }
}
