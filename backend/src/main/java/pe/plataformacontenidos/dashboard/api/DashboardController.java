package pe.plataformacontenidos.dashboard.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import pe.plataformacontenidos.shared.api.Problems;
import pe.plataformacontenidos.dashboard.DashboardService;
import pe.plataformacontenidos.dashboard.DashboardSummary;
import pe.plataformacontenidos.dashboard.InvalidDashboardRangeException;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.permission.RequiresAnyModule;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/** Inicio del panel: una sola llamada con todo lo que se dibuja (hoja de ruta F3). */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final PermissionService permissionService;

    public DashboardController(DashboardService dashboardService, PermissionService permissionService) {
        this.dashboardService = dashboardService;
        this.permissionService = permissionService;
    }

    @GetMapping
    @RequiresAnyModule({ Module.PUBLICATIONS, Module.PLACES, Module.CELEBRATIONS, Module.GALLERIES, Module.DIRECTORY })
    public DashboardSummary get(@RequestParam(defaultValue = "30") int range,
            @AuthenticationPrincipal UserPrincipal principal) {
        return dashboardService.summary(permissionService.forUser(principal.userId()), range);
    }

    /** 400 directo: el reenvío a /error lo convertiría en 403 (ver FeedExceptionHandler). */
    @ExceptionHandler({ InvalidDashboardRangeException.class, MethodArgumentTypeMismatchException.class })
    public ResponseEntity<ProblemDetail> invalidRange(RuntimeException ex) {
        String message = ex instanceof InvalidDashboardRangeException ? ex.getMessage() : "Período inválido.";
        return Problems.of(HttpStatus.BAD_REQUEST, message);
    }
}
