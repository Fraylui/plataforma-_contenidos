package pe.plataformacontenidos.advertising;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CampaignRepository extends JpaRepository<Campaign, UUID> {

    List<Campaign> findByAdvertiserId(UUID advertiserId);

    boolean existsByAdvertiserId(UUID advertiserId);

    /** Candidatas para una posición: el filtro de vigencia (fechas) se aplica en memoria (Campaign.isCurrentlyServable). */
    List<Campaign> findByPlacementKeyAndActiveTrueOrderByCreatedAtAsc(String placementKey);

    /** Contadores totales con UPDATE atómico: leer-sumar-guardar perdía conteos con vistas simultáneas. */
    @Modifying
    @Query("UPDATE Campaign c SET c.impressionCount = c.impressionCount + 1 WHERE c.id = :id")
    void incrementImpressions(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE Campaign c SET c.clickCount = c.clickCount + 1 WHERE c.id = :id")
    void incrementClicks(@Param("id") UUID id);
}
