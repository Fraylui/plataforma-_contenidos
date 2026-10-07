package pe.plataformacontenidos.content.api;

import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.RequiresModule;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.content.api.dto.ArticleRequest;
import pe.plataformacontenidos.content.api.dto.ArticleResponse;
import pe.plataformacontenidos.shared.publishing.api.ReturnToDraftRequest;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * CRUD de contenido + transiciones de workflow. La autorización fina (dueño vs.
 * EDITOR+, qué transición es legal desde qué estado) vive en ArticleService,
 * no aquí — este controller solo traduce HTTP ↔ dominio.
 */
@RestController
@RequiresModule(value = Module.ARTICLES)
@RequestMapping("/api/v1/admin/articles")
public class ArticleAdminController {

    private final ArticleService articleService;
    private final PermissionService permissionService;

    public ArticleAdminController(ArticleService articleService, PermissionService permissionService) {
        this.permissionService = permissionService;
        this.articleService = articleService;
    }

    @GetMapping
    public List<ArticleResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return articleService.listForAdmin(principal.userId(), canPublish(principal)).stream()
                .map(ArticleResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ArticleResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.getForAdmin(id, principal.userId(), canPublish(principal)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ArticleResponse create(@Valid @RequestBody ArticleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public ArticleResponse update(@PathVariable UUID id, @Valid @RequestBody ArticleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(
                articleService.update(id, request.toInput(), principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/submit")
    public ArticleResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public ArticleResponse returnToDraft(@PathVariable UUID id, @Valid @RequestBody(required = false) ReturnToDraftRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String note = request == null ? null : request.note();
        return ArticleResponse.from(articleService.returnToDraft(id, note, principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/publish")
    public ArticleResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.publish(id, principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/schedule")
    public ArticleResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(
                articleService.schedule(id, request.scheduledAt(), principal.userId(), canPublish(principal)));
    }

    @PostMapping("/{id}/archive")
    public ArticleResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.archive(id, principal.userId(), canPublish(principal)));
    }

    private boolean canPublish(UserPrincipal principal) {
        var permissions = permissionService.forUser(principal.userId());
        return permissions.canPublish(Module.ARTICLES);
    }
}
