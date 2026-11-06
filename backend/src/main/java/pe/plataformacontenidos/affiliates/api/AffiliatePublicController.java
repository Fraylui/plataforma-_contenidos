package pe.plataformacontenidos.affiliates.api;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import pe.plataformacontenidos.affiliates.AffiliateClickCounter;
import pe.plataformacontenidos.affiliates.AffiliateLinkService;
import pe.plataformacontenidos.catalog.ContentType;

/**
 * Público (SecurityConfig): los enlaces de afiliado de un contenido publicado,
 * y la redirección que cuenta el clic. Nunca se manda la dirección de destino
 * en la lista: el sitio enlaza a /go, así cada clic queda contado.
 */
@RestController
@RequestMapping("/api/v1/affiliate-links")
public class AffiliatePublicController {

    private final AffiliateLinkService links;
    private final AffiliateClickCounter clicks;

    public AffiliatePublicController(AffiliateLinkService links, AffiliateClickCounter clicks) {
        this.links = links;
        this.clicks = clicks;
    }

    /** {@code store}: dominio de la tienda, para que el lector sepa a dónde va antes de tocar. */
    public record PublicLink(UUID id, String label, String store) {
    }

    @GetMapping
    public ResponseEntity<List<PublicLink>> list(@RequestParam ContentType type, @RequestParam UUID id) {
        List<PublicLink> body = links.listPublic(type, id).stream()
                .map(link -> new PublicLink(link.id(), link.label(), store(link.url())))
                .toList();
        return ResponseEntity.ok().cacheControl(CacheControl.noCache()).body(body);
    }

    @GetMapping("/{linkId}/go")
    public ResponseEntity<Void> go(@PathVariable UUID linkId, HttpServletRequest request) {
        return links.destination(linkId)
                .map(url -> {
                    clicks.record(linkId, request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
                    return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url))
                            .cacheControl(CacheControl.noStore())
                            .header("X-Robots-Tag", "noindex, nofollow")
                            .<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Tipo o id ilegible: 400 directo (el reenvío a /error lo convertiría en 403, ver FeedExceptionHandler). */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Void> badRequest() {
        return ResponseEntity.badRequest().build();
    }

    static String store(String url) {
        String host = URI.create(url).getHost();
        return host.startsWith("www.") ? host.substring(4) : host;
    }
}
