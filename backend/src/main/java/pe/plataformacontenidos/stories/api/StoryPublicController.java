package pe.plataformacontenidos.stories.api;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.engagement.ContentLikeService;
import pe.plataformacontenidos.engagement.LikeResponse;
import pe.plataformacontenidos.stories.Story;
import pe.plataformacontenidos.stories.StoryCtaCounter;
import pe.plataformacontenidos.stories.StoryNotFoundException;
import pe.plataformacontenidos.stories.StoryService;
import pe.plataformacontenidos.stories.api.StoryDtos.ActiveTopic;
import pe.plataformacontenidos.stories.api.StoryDtos.StoryDetail;
import pe.plataformacontenidos.stories.api.StoryDtos.StoryView;

/**
 * Historias para el visitante (público en SecurityConfig). Lo que caducó no
 * se ve, salvo las Destacadas; el frontend cachea la fila unos segundos.
 */
@RestController
@RequestMapping("/api/v1/stories")
public class StoryPublicController {

    private final StoryService stories;
    private final StoryViews views;
    private final StoryCtaCounter ctaCounter;
    private final ContentLikeService likes;

    StoryPublicController(StoryService stories, StoryViews views, StoryCtaCounter ctaCounter, ContentLikeService likes) {
        this.stories = stories;
        this.views = views;
        this.ctaCounter = ctaCounter;
        this.likes = likes;
    }

    @GetMapping("/active")
    public List<ActiveTopic> active() {
        return views.activeTopics(stories.listActive());
    }

    @GetMapping("/highlights")
    public List<StoryView> highlights(@RequestParam UUID categoryId) {
        return views.views(stories.listHighlights(categoryId));
    }

    @GetMapping("/{id}")
    public StoryDetail get(@PathVariable UUID id) {
        Story story = visible(id);
        return new StoryDetail(views.view(story), views.topicOf(story).orElseThrow(() -> new StoryNotFoundException(id)));
    }

    /** Siempre 204: un toque descartado (robot, repetido, id inventado) no se nota. */
    @PostMapping("/{id}/cta")
    public ResponseEntity<Void> cta(@PathVariable UUID id, HttpServletRequest request) {
        ctaCounter.record(id, request.getRemoteAddr(), request.getHeader(HttpHeaders.USER_AGENT));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public LikeResponse like(@PathVariable UUID id, @RequestParam UUID visitorId) {
        return LikeResponse.from(likes.toggleLike(ContentType.STORY, visible(id).getId(), visitorId));
    }

    private Story visible(UUID id) {
        return stories.findVisible(id).orElseThrow(() -> new StoryNotFoundException(id));
    }
}
