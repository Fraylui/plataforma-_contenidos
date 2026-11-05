package pe.plataformacontenidos.affiliates.api;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import pe.plataformacontenidos.affiliates.AffiliateLink;
import pe.plataformacontenidos.affiliates.AffiliateLinkService;
import pe.plataformacontenidos.affiliates.AffiliateLinkService.LinkInput;
import pe.plataformacontenidos.affiliates.InvalidAffiliateLinkException;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.UserPrincipal;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.permission.RequiresAnyModule;
import pe.plataformacontenidos.shared.api.Problems;

/**
 * Panel: los enlaces de afiliado de una publicación o un lugar, con sus clics.
 * Puede editarlos quien puede publicar en el módulo de ese contenido:
 * @RequiresAnyModule deja pasar a quien tiene alguno de los dos, y
 * canEdit comprueba el del tipo pedido.
 */
@RestController
@RequestMapping("/api/v1/admin/affiliate-links/{type}/{contentId}")
public class AffiliateAdminController {

    private final AffiliateLinkService links;
    private final PermissionService permissionService;

    public AffiliateAdminController(AffiliateLinkService links, PermissionService permissionService) {
        this.links = links;
        this.permissionService = permissionService;
    }

    public record ReplaceRequest(@Valid List<LinkInput> links) {
    }

    @GetMapping
    @RequiresAnyModule({ Module.PUBLICATIONS, Module.PLACES })
    public ResponseEntity<?> list(@PathVariable ContentType type, @PathVariable UUID contentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (!links.canEdit(permissionService.forUser(principal.userId()), type)) {
            return Problems.of(HttpStatus.FORBIDDEN, "No tienes permiso para esta sección.");
        }
        return ResponseEntity.ok(links.list(type, contentId));
    }

    @PutMapping
    @RequiresAnyModule({ Module.PUBLICATIONS, Module.PLACES })
    public ResponseEntity<?> replace(@PathVariable ContentType type, @PathVariable UUID contentId,
            @RequestBody ReplaceRequest body, @AuthenticationPrincipal UserPrincipal principal) {
        if (!links.canEdit(permissionService.forUser(principal.userId()), type)) {
            return Problems.of(HttpStatus.FORBIDDEN, "No tienes permiso para esta sección.");
        }
        List<AffiliateLink> saved = links.replace(type, contentId, body == null ? List.of() : body.links());
        return ResponseEntity.ok(saved);
    }

    /** 400 directo: el reenvío a /error lo convertiría en 403 (ver DashboardController). */
    @ExceptionHandler(InvalidAffiliateLinkException.class)
    public ResponseEntity<ProblemDetail> invalid(InvalidAffiliateLinkException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ProblemDetail> badPath() {
        return Problems.of(HttpStatus.BAD_REQUEST, "Contenido inválido.");
    }
}
