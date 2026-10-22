package pe.plataformacontenidos.engagement.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.engagement.ContentViewCounter;

/**
 * Público (SecurityConfig): la página de cada contenido avisa que se abrió.
 * Siempre responde 204 — el lector no se entera si la visita se descartó
 * (robot, repetida o id inexistente) y un script no aprende nada de la respuesta.
 */
@RestController
@RequestMapping("/api/v1/views")
public class ContentViewController {

    private final ContentViewCounter counter;

    public ContentViewController(ContentViewCounter counter) {
        this.counter = counter;
    }

    @PostMapping
    public ResponseEntity<Void> record(@Valid @RequestBody ViewRequest body, HttpServletRequest request) {
        counter.record(body.type(), body.id(), request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.noContent().build();
    }

    /** Cuerpo ilegible o tipo inexistente: 400 directo (el reenvío a /error lo convertiría en 403, ver FeedExceptionHandler). */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Void> unreadable() {
        return ResponseEntity.badRequest().build();
    }

    public record ViewRequest(@NotNull ContentType type, @NotNull UUID id) {
    }
}
