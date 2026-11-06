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
import pe.plataformacontenidos.dashboard.CalendarService;
import pe.plataformacontenidos.dashboard.InvalidCalendarMonthException;
import pe.plataformacontenidos.identity.UserPrincipal;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.permission.RequiresAnyModule;
import pe.plataformacontenidos.shared.api.Problems;

/** Calendario de publicaciones del panel: lo publicado, lo programado y las fechas de un mes. */
@RestController
@RequestMapping("/api/v1/admin/calendar")
public class CalendarController {

    private final CalendarService calendarService;
    private final PermissionService permissionService;

    public CalendarController(CalendarService calendarService, PermissionService permissionService) {
        this.calendarService = calendarService;
        this.permissionService = permissionService;
    }

    @GetMapping
    @RequiresAnyModule({ Module.PUBLICATIONS, Module.PLACES, Module.CELEBRATIONS, Module.GALLERIES })
    public CalendarService.Month get(@RequestParam(required = false) String month,
            @AuthenticationPrincipal UserPrincipal principal) {
        return calendarService.month(permissionService.forUser(principal.userId()), month);
    }

    @GetMapping("/today")
    @RequiresAnyModule({ Module.PUBLICATIONS, Module.PLACES, Module.CELEBRATIONS, Module.GALLERIES })
    public CalendarService.Today today(@AuthenticationPrincipal UserPrincipal principal) {
        return calendarService.today(permissionService.forUser(principal.userId()));
    }

    /** 400 directo: el reenvío a /error lo convertiría en 403 (ver DashboardController). */
    @ExceptionHandler(InvalidCalendarMonthException.class)
    public ResponseEntity<ProblemDetail> invalidMonth(InvalidCalendarMonthException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
