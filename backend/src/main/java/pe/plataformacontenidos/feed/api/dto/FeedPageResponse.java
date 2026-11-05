package pe.plataformacontenidos.feed.api.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import pe.plataformacontenidos.engagement.Reaction;

/**
 * `hasMore` es la señal para el scroll infinito del frontend: false significa
 * que, dado lo que el visitante ya vio (excludeIds), no queda contenido
 * publicado sin mostrar — el cliente debe dejar de pedir más, no seguir
 * spineando indefinidamente.
 */
public record FeedPageResponse(List<FeedItemResponse> items, boolean hasMore,
        /** Reacciones por id de ítem (solo los que tienen alguna), para el resumen de cada tarjeta. */
        Map<UUID, Map<Reaction, Long>> reactions) {
}
