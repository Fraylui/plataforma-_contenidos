package pe.plataformacontenidos.audit.api;

import java.time.Instant;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.audit.AuditService.AuditSearchCriteria;
import pe.plataformacontenidos.audit.api.dto.AuditEventResponse;
import pe.plataformacontenidos.audit.api.dto.PageResponse;

/**
 * Consulta del audit log (CONTEXTO.md secciones 18, 35.3 fase 1 y 37).
 * Restringido a SUPER_ADMIN/ADMIN en SecurityConfig: los eventos incluyen
 * IPs y acciones de todos los usuarios (incluidos otros administradores),
 * información más sensible que un listado editorial normal. Solo lectura —
 * no existe endpoint de edición/borrado, el log es append-only.
 */
@RestController
@RequestMapping("/api/v1/admin/audit")
public class AuditController {

    private static final int MAX_PAGE_SIZE = 100;

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public PageResponse<AuditEventResponse> search(
            @RequestParam(required = false) String actorEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) AuditResult result,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        var criteria = new AuditSearchCriteria(actorEmail, action, resourceType, result, from, to);
        var pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "occurredAt"));
        return PageResponse.from(auditService.search(criteria, pageable), AuditEventResponse::from);
    }
}
