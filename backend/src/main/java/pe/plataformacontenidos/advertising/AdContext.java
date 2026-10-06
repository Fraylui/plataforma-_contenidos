package pe.plataformacontenidos.advertising;

import java.util.Set;
import java.util.UUID;

/**
 * Dónde y para quién se va a mostrar un anuncio: la sección y el tema de la
 * página (con sus ancestros, ver CategoryService.lineage) y la ubicación del
 * visitante según Cloudflare. Cualquier dato puede faltar (null / vacío):
 * entonces solo califican las campañas que no restringen esa dimensión.
 */
public record AdContext(AdSection section, Set<UUID> categoryLineage, String country, String region,
        String regionCode) {

    public static final AdContext NONE = new AdContext(null, Set.of(), null, null, null);
}
