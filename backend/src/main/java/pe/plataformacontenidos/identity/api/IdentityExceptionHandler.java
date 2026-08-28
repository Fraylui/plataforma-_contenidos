package pe.plataformacontenidos.identity.api;

import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.identity.CannotModifyOwnAccountException;
import pe.plataformacontenidos.identity.EmailAlreadyExistsException;
import pe.plataformacontenidos.identity.InvalidCredentialsException;
import pe.plataformacontenidos.identity.MfaRequiredException;
import pe.plataformacontenidos.identity.SuperAdminManagementDeniedException;
import pe.plataformacontenidos.identity.TooManyAttemptsException;
import pe.plataformacontenidos.identity.UserNotFoundException;
import pe.plataformacontenidos.identity.mfa.MfaChallengeException;
import pe.plataformacontenidos.identity.mfa.MfaDisableForbiddenException;

@RestControllerAdvice
public class IdentityExceptionHandler {

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(InvalidCredentialsException ex) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(MfaRequiredException.class)
    public ResponseEntity<ApiError> handleMfaRequired(MfaRequiredException ex) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(MfaChallengeException.class)
    public ResponseEntity<ApiError> handleMfaChallenge(MfaChallengeException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(MfaDisableForbiddenException.class)
    public ResponseEntity<ApiError> handleMfaDisableForbidden(MfaDisableForbiddenException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(TooManyAttemptsException.class)
    public ResponseEntity<ApiError> handleTooManyAttempts(TooManyAttemptsException ex) {
        return error(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleEmailExists(EmailAlreadyExistsException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiError> handleUserNotFound(UserNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SuperAdminManagementDeniedException.class)
    public ResponseEntity<ApiError> handleSuperAdminManagementDenied(SuperAdminManagementDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(CannotModifyOwnAccountException.class)
    public ResponseEntity<ApiError> handleCannotModifyOwnAccount(CannotModifyOwnAccountException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(Instant.now(), HttpStatus.BAD_REQUEST.value(), "Solicitud inválida", details));
    }

    private ResponseEntity<ApiError> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ApiError(Instant.now(), status.value(), message, List.of()));
    }

    public record ApiError(Instant timestamp, int status, String message, List<String> details) {
    }
}
