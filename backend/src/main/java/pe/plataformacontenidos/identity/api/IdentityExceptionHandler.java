package pe.plataformacontenidos.identity.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.plataformacontenidos.identity.EmailAlreadyExistsException;
import pe.plataformacontenidos.identity.InvalidCredentialsException;
import pe.plataformacontenidos.identity.WeakPasswordException;
import pe.plataformacontenidos.identity.WrongCurrentPasswordException;
import pe.plataformacontenidos.identity.TooManyAttemptsException;
import pe.plataformacontenidos.identity.UserNotFoundException;
import pe.plataformacontenidos.shared.api.Problems;

@RestControllerAdvice
public class IdentityExceptionHandler {

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ProblemDetail> handleInvalidCredentials(InvalidCredentialsException ex) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(TooManyAttemptsException.class)
    public ResponseEntity<ProblemDetail> handleTooManyAttempts(TooManyAttemptsException ex) {
        return error(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ProblemDetail> handleEmailExists(EmailAlreadyExistsException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleUserNotFound(UserNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }



    @ExceptionHandler({ WeakPasswordException.class, WrongCurrentPasswordException.class })
    public ResponseEntity<ProblemDetail> handlePasswordRejected(RuntimeException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    private ResponseEntity<ProblemDetail> error(HttpStatus status, String message) {
        return Problems.of(status, message);
    }
}
