package pe.plataformacontenidos.advertising;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignRepository extends JpaRepository<Campaign, UUID> {

    List<Campaign> findByAdvertiserId(UUID advertiserId);

    boolean existsByAdvertiserId(UUID advertiserId);

    /** Candidatas para una posición: el filtro de vigencia (fechas) se aplica en memoria (Campaign.isCurrentlyServable). */
    List<Campaign> findByPlacementKeyAndActiveTrueOrderByCreatedAtAsc(String placementKey);
}
