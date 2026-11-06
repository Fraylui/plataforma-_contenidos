package pe.plataformacontenidos.engagement.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.engagement.ContentReactionService;
import pe.plataformacontenidos.engagement.ContentReactionService.Reactions;
import pe.plataformacontenidos.engagement.Reaction;

/**
 * Público (SecurityConfig): reacciones de un contenido publicado. El
 * visitante se identifica solo con su id anónimo del navegador (el mismo de
 * los «me gusta»); 404 si el contenido no está publicado.
 */
@RestController
@RequestMapping("/api/v1/reactions")
public class ContentReactionController {

    private final ContentReactionService reactions;

    public ContentReactionController(ContentReactionService reactions) {
        this.reactions = reactions;
    }

    /** {@code reaction} null o ausente quita la reacción. */
    public record ReactRequest(@NotNull ContentType type, @NotNull UUID id, @NotNull UUID visitorId, Reaction reaction) {
    }

    @GetMapping
    public ResponseEntity<Reactions> get(@RequestParam ContentType type, @RequestParam UUID id,
            @RequestParam(required = false) UUID visitorId) {
        return reactions.get(type, id, visitorId)
                .map(body -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Reactions> react(@Valid @RequestBody ReactRequest body) {
        return reactions.react(body.type(), body.id(), body.visitorId(), body.reaction())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Cuerpo ilegible o tipo inexistente: 400 directo (el reenvío a /error lo convertiría en 403). */
    @ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MethodArgumentNotValidException.class })
    public ResponseEntity<Void> badRequest() {
        return ResponseEntity.badRequest().build();
    }
}
