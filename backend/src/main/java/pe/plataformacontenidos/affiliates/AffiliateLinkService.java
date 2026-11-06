package pe.plataformacontenidos.affiliates;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.catalog.ContentLookup;
import pe.plataformacontenidos.catalog.ContentRegistry;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Permissions;

/**
 * Enlaces de afiliado de publicaciones y lugares. Se editan como lista
 * completa (reemplazar = el orden es el de la lista) y se muestran solo si el
 * contenido está publicado. El clic pasa por el backend para contarlo y
 * después redirige a la tienda.
 */
@Service
public class AffiliateLinkService {

    public static final Set<ContentType> TYPES = Set.of(ContentType.PUBLICATION, ContentType.PLACE);
    public static final int MAX_LINKS = 10;
    static final int MAX_LABEL = 80;
    static final int MAX_URL = 2048;

    public record LinkInput(String label, String url) {
    }

    private final JdbcTemplate jdbc;
    private final ContentRegistry contents;
    private final ContentLookup lookup;

    public AffiliateLinkService(JdbcTemplate jdbc, ContentRegistry contents, ContentLookup lookup) {
        this.jdbc = jdbc;
        this.contents = contents;
        this.lookup = lookup;
    }

    /** Quien puede publicar en el módulo del contenido puede ver y editar sus enlaces. */
    public boolean canEdit(Permissions permissions, ContentType type) {
        return TYPES.contains(type) && permissions.can(contents.byType(type).module(), AccessLevel.PUBLISH);
    }

    public List<AffiliateLink> list(ContentType type, UUID contentId) {
        requireType(type);
        return jdbc.query("""
                SELECT id, position, label, url, clicks FROM affiliates.affiliate_links
                 WHERE content_type = ? AND content_id = ? ORDER BY position
                """, (rs, n) -> new AffiliateLink(rs.getObject(1, UUID.class), rs.getInt(2), rs.getString(3),
                rs.getString(4), rs.getLong(5)), type.name(), contentId);
    }

    /** Para el sitio: vacío si el contenido no existe o no está publicado. */
    public List<AffiliateLink> listPublic(ContentType type, UUID contentId) {
        if (!TYPES.contains(type) || lookup.find(type, contentId).isEmpty()) {
            return List.of();
        }
        return list(type, contentId);
    }

    /**
     * Reemplaza todos los enlaces del contenido. Un enlace que conserva su
     * dirección conserva también sus clics, aunque cambie de lugar o de nombre.
     */
    @Transactional
    public List<AffiliateLink> replace(ContentType type, UUID contentId, List<LinkInput> inputs) {
        requireType(type);
        List<LinkInput> clean = validate(inputs);
        // Tabla validada como identificador en ContentSource; nunca del usuario.
        Integer found = jdbc.queryForObject("SELECT count(*) FROM " + contents.byType(type).table() + " WHERE id = ?",
                Integer.class, contentId);
        if (found == null || found == 0) {
            throw new InvalidAffiliateLinkException("Guarda el contenido antes de agregarle enlaces.");
        }
        List<AffiliateLink> previous = list(type, contentId);
        jdbc.update("DELETE FROM affiliates.affiliate_links WHERE content_type = ? AND content_id = ?", type.name(), contentId);
        for (int i = 0; i < clean.size(); i++) {
            LinkInput link = clean.get(i);
            long clicks = previous.stream().filter(p -> p.url().equals(link.url())).mapToLong(AffiliateLink::clicks)
                    .max().orElse(0);
            jdbc.update("""
                    INSERT INTO affiliates.affiliate_links (content_type, content_id, position, label, url, clicks)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, type.name(), contentId, i, link.label(), link.url(), clicks);
        }
        return list(type, contentId);
    }

    /** Dirección de destino del enlace, si existe y su contenido está publicado. */
    public Optional<String> destination(UUID linkId) {
        List<String[]> rows = jdbc.query(
                "SELECT content_type, content_id::text, url FROM affiliates.affiliate_links WHERE id = ?",
                (rs, n) -> new String[] { rs.getString(1), rs.getString(2), rs.getString(3) }, linkId);
        return rows.stream().findFirst()
                .filter(row -> lookup.find(ContentType.valueOf(row[0]), UUID.fromString(row[1])).isPresent())
                .map(row -> row[2]);
    }

    void incrementClicks(UUID linkId) {
        jdbc.update("UPDATE affiliates.affiliate_links SET clicks = clicks + 1 WHERE id = ?", linkId);
    }

    static List<LinkInput> validate(List<LinkInput> inputs) {
        if (inputs == null) {
            return List.of();
        }
        if (inputs.size() > MAX_LINKS) {
            throw new InvalidAffiliateLinkException("Hasta " + MAX_LINKS + " enlaces por contenido.");
        }
        List<LinkInput> clean = new ArrayList<>();
        for (LinkInput input : inputs) {
            String label = input == null || input.label() == null ? "" : input.label().strip();
            String url = input == null || input.url() == null ? "" : input.url().strip();
            if (label.isEmpty() || label.length() > MAX_LABEL) {
                throw new InvalidAffiliateLinkException("Cada enlace necesita un nombre de hasta " + MAX_LABEL + " letras.");
            }
            if (!isSafeHttpsUrl(url)) {
                throw new InvalidAffiliateLinkException("El enlace «" + label + "» debe empezar con https:// y ser una dirección válida.");
            }
            clean.add(new LinkInput(label, url));
        }
        return clean;
    }

    static boolean isSafeHttpsUrl(String url) {
        if (url.length() > MAX_URL || !url.startsWith("https://") || url.chars().anyMatch(Character::isWhitespace)) {
            return false;
        }
        try {
            URI uri = new URI(url);
            return "https".equals(uri.getScheme()) && uri.getHost() != null && uri.getHost().contains(".")
                    && uri.getUserInfo() == null;
        } catch (Exception ex) {
            return false;
        }
    }

    private static void requireType(ContentType type) {
        if (!TYPES.contains(type)) {
            throw new InvalidAffiliateLinkException("Los enlaces de afiliado van en publicaciones y lugares.");
        }
    }
}
