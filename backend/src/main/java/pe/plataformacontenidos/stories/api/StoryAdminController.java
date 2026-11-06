package pe.plataformacontenidos.stories.api;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.UserPrincipal;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.RequiresModule;
import pe.plataformacontenidos.stories.StoryService;
import pe.plataformacontenidos.stories.StoryService.AdminTab;
import pe.plataformacontenidos.stories.api.StoryDtos.AdminStory;
import pe.plataformacontenidos.stories.api.StoryDtos.CreateStoriesRequest;
import pe.plataformacontenidos.stories.api.StoryDtos.HighlightRequest;
import pe.plataformacontenidos.stories.api.StoryDtos.StoryItemRequest;

/** Historias en el panel: activas, Destacadas y terminadas (7 días), con sus vistas, me gusta y toques. */
@RestController
@RequiresModule(value = Module.STORIES)
@RequestMapping("/api/v1/admin/stories")
public class StoryAdminController {

    private final StoryService stories;
    private final StoryViews views;

    StoryAdminController(StoryService stories, StoryViews views) {
        this.stories = stories;
        this.views = views;
    }

    @GetMapping
    public List<AdminStory> list(@RequestParam(defaultValue = "ACTIVE") AdminTab tab) {
        return views.admin(stories.listForAdmin(tab));
    }

    @GetMapping("/{id}")
    public AdminStory get(@PathVariable UUID id) {
        return views.admin(List.of(stories.getForAdmin(id))).getFirst();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<AdminStory> create(@Valid @RequestBody CreateStoriesRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return views.admin(stories.createBatch(request.categoryId(),
                request.items().stream().map(StoryItemRequest::toItem).toList(), principal.userId()));
    }

    @PutMapping("/{id}")
    public AdminStory update(@PathVariable UUID id, @RequestBody StoryItemRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return views.admin(List.of(stories.update(id, request.toItem(), principal.userId()))).getFirst();
    }

    @PutMapping("/{id}/highlight")
    public AdminStory highlight(@PathVariable UUID id, @RequestBody HighlightRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return views.admin(List.of(stories.setHighlighted(id, request.highlighted(), principal.userId()))).getFirst();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        stories.delete(id, principal.userId());
    }
}
