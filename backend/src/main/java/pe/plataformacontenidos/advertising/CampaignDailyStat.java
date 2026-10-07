package pe.plataformacontenidos.advertising;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

/** Impresiones visibles y clics válidos de una campaña en un día (UTC) — base del reporte al anunciante. */
@Entity
@Table(name = "campaign_daily_stats", schema = "advertising")
@IdClass(CampaignDailyStat.Key.class)
public class CampaignDailyStat {

    @Id
    @Column(name = "campaign_id")
    private UUID campaignId;

    @Id
    private LocalDate day;

    @Column(nullable = false)
    private long impressions;

    @Column(nullable = false)
    private long clicks;

    protected CampaignDailyStat() {
        // JPA
    }

    public UUID getCampaignId() {
        return campaignId;
    }

    public LocalDate getDay() {
        return day;
    }

    public long getImpressions() {
        return impressions;
    }

    public long getClicks() {
        return clicks;
    }

    public record Key(UUID campaignId, LocalDate day) implements Serializable {
        public Key() {
            this(null, null);
        }
    }
}
