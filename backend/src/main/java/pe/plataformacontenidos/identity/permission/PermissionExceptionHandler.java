package pe.plataformacontenidos.identity.permission;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.identity.OwnerManagementDeniedException;
import pe.plataformacontenidos.shared.api.Problems;

/** Errores de permisos con un código estable para el panel (spec 2a §8), en la propiedad «code» (RFC 9457). */
@RestControllerAdvice
public class PermissionExceptionHandler {

    @ExceptionHandler(ModuleAccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleModuleAccessDenied(ModuleAccessDeniedException ex) {
        return Problems.of(HttpStatus.FORBIDDEN, "MODULE_ACCESS_DENIED", ex.getMessage());
    }

    @ExceptionHandler(OwnerManagementDeniedException.class)
    public ResponseEntity<ProblemDetail> handleOwnerManagementDenied(OwnerManagementDeniedException ex) {
        return Problems.of(HttpStatus.FORBIDDEN, "OWNER_MANAGEMENT_DENIED", ex.getMessage());
    }

    @ExceptionHandler(InvalidPermissionException.class)
    public ResponseEntity<ProblemDetail> handleInvalidPermission(InvalidPermissionException ex) {
        return Problems.of(HttpStatus.BAD_REQUEST, "INVALID_PERMISSION", ex.getMessage());
    }
}
