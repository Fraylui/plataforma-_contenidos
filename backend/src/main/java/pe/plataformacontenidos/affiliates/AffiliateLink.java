package pe.plataformacontenidos.affiliates;

import java.util.UUID;

/** Un enlace de afiliado de una publicación o un lugar, en su orden. {@code clicks}: veces que se abrió. */
public record AffiliateLink(UUID id, int position, String label, String url, long clicks) {
}
