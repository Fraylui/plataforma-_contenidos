package pe.plataformacontenidos.identity.permission;

import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.identity.OwnerManagementDeniedException;

/** Errores de permisos con un código estable para el panel (spec 2a §8). */
@RestControllerAdvice
public class PermissionExceptionHandler {

    public record PermissionError(Instant timestamp, int status, String code, String message) {
    }

    @ExceptionHandler(ModuleAccessDeniedException.class)
    public ResponseEntity<PermissionError> handleModuleAccessDenied(ModuleAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new PermissionError(Instant.now(), 403, "MODULE_ACCESS_DENIED", ex.getMessage()));
    }

    @ExceptionHandler(OwnerManagementDeniedException.class)
    public ResponseEntity<PermissionError> handleOwnerManagementDenied(OwnerManagementDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new PermissionError(Instant.now(), 403, "OWNER_MANAGEMENT_DENIED", ex.getMessage()));
    }

    @ExceptionHandler(InvalidPermissionException.class)
    public ResponseEntity<PermissionError> handleInvalidPermission(InvalidPermissionException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new PermissionError(Instant.now(), 400, "INVALID_PERMISSION", ex.getMessage()));
    }

    @ExceptionHandler(PublishPermissionRequiredException.class)
    public ResponseEntity<PermissionError> handlePublishRequired(PublishPermissionRequiredException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new PermissionError(Instant.now(), 403, "PUBLISH_PERMISSION_REQUIRED", ex.getMessage()));
    }
}
