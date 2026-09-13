package pe.plataformacontenidos.feed.api.dto;

import java.util.List;

/**
 * `hasMore` es la señal para el scroll infinito del frontend: false significa
 * que, dado lo que el visitante ya vio (excludeIds), no queda contenido
 * publicado sin mostrar — el cliente debe dejar de pedir más, no seguir
 * spineando indefinidamente.
 */
public record FeedPageResponse(List<FeedItemResponse> items, boolean hasMore) {
}
