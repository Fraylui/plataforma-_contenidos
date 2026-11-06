package pe.plataformacontenidos.live.api;

import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.live.LiveStreamService;
import pe.plataformacontenidos.live.api.LiveDtos.LiveResponse;

/** Público (SecurityConfig): qué está en vivo ahora, lo próximo y la página de cada transmisión. */
@RestController
@RequestMapping("/api/v1/live")
public class LivePublicController {

    private final LiveStreamService liveStreamService;

    public LivePublicController(LiveStreamService liveStreamService) {
        this.liveStreamService = liveStreamService;
    }

    /** La transmisión en vivo ahora, o 204 si no hay ninguna. */
    @GetMapping("/now")
    public ResponseEntity<LiveResponse> now() {
        return liveStreamService.current()
                .map(stream -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(LiveResponse.from(stream)))
                .orElseGet(() -> ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build());
    }

    @GetMapping("/upcoming")
    public List<LiveResponse> upcoming() {
        return liveStreamService.upcoming().stream().map(LiveResponse::from).toList();
    }

    @GetMapping("/{slug}")
    public LiveResponse get(@PathVariable String slug) {
        return LiveResponse.from(liveStreamService.getPublicBySlug(slug));
    }
}
