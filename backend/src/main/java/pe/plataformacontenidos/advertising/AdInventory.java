package pe.plataformacontenidos.advertising;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.taxonomy.CategoryService;

/**
 * Cupo por público: como mucho {@link #MAX_COMPETING_CAMPAIGNS} campañas
 * activas compitiendo por el mismo público — con más, cada anunciante
 * recibiría tan pocas vistas que no le convendría pagar.
 */
@Component
class AdInventory {

    /** Campañas activas que pueden competir por el mismo público (posición + segmentación + fechas). */
    static final int MAX_COMPETING_CAMPAIGNS = 5;

    private final CampaignRepository campaignRepository;
    private final CategoryService categoryService;

    AdInventory(CampaignRepository campaignRepository, CategoryService categoryService) {
        this.campaignRepository = campaignRepository;
        this.categoryService = categoryService;
    }

    /**
     * Cupo por público: cuenta las campañas activas, no vencidas, de la misma
     * posición cuyas fechas y segmentación se cruzan con las de esta. Con
     * {@link #MAX_COMPETING_CAMPAIGNS} o más, una nueva le quitaría vistas a
     * las que ya pagaron.
     */
    void requireRoomFor(UUID selfId, String placementKey, Instant startsAt, Instant endsAt,
            CampaignTargeting targeting) {
        Instant now = Instant.now();
        Map<UUID, Set<UUID>> lineageCache = new HashMap<>();
        Function<UUID, Set<UUID>> lineage = id -> lineageCache.computeIfAbsent(id, categoryService::lineage);
        long competing = campaignRepository.findByPlacementKeyAndActiveTrueOrderByCreatedAtAsc(placementKey).stream()
                .filter(other -> !other.getId().equals(selfId))
                .filter(other -> other.getEndsAt() == null || other.getEndsAt().isAfter(now))
                .filter(other -> schedulesOverlap(other.getStartsAt(), other.getEndsAt(), startsAt, endsAt))
                .filter(other -> other.getTargeting().overlaps(targeting, lineage))
                .count();
        if (competing >= MAX_COMPETING_CAMPAIGNS) {
            throw new AdInventoryFullException(String.format(
                    "Ya hay %d campañas activas para este espacio y este público en esas fechas (máximo %d). "
                            + "Elige otro tema, sección o zona, otras fechas, o desactiva una de las actuales.",
                    competing, MAX_COMPETING_CAMPAIGNS));
        }
    }

    /** Rangos abiertos (null = sin inicio / sin fin). */
    private static boolean schedulesOverlap(Instant aStart, Instant aEnd, Instant bStart, Instant bEnd) {
        boolean aBeforeB = aEnd != null && bStart != null && !aEnd.isAfter(bStart);
        boolean bBeforeA = bEnd != null && aStart != null && !bEnd.isAfter(aStart);
        return !aBeforeB && !bBeforeA;
    }
}
