package pe.plataformacontenidos.advertising;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CampaignDailyStatRepository extends JpaRepository<CampaignDailyStat, CampaignDailyStat.Key> {

    List<CampaignDailyStat> findByCampaignIdAndDayGreaterThanEqualOrderByDayAsc(UUID campaignId, LocalDate from);

    /** Upsert atómico: dos vistas simultáneas nunca se pisan (sin leer-sumar-guardar). */
    @Modifying
    @Query(value = """
            INSERT INTO advertising.campaign_daily_stats (campaign_id, day, impressions, clicks)
            VALUES (:campaignId, :day, :impressions, :clicks)
            ON CONFLICT (campaign_id, day) DO UPDATE
               SET impressions = advertising.campaign_daily_stats.impressions + EXCLUDED.impressions,
                   clicks      = advertising.campaign_daily_stats.clicks + EXCLUDED.clicks
            """, nativeQuery = true)
    void add(@Param("campaignId") UUID campaignId, @Param("day") LocalDate day,
            @Param("impressions") long impressions, @Param("clicks") long clicks);
}
