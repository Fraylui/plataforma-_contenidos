package pe.plataformacontenidos.content.api;

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
import pe.plataformacontenidos.content.api.dto.RejectArticleRequest;
import pe.plataformacontenidos.content.api.dto.ScheduleArticleRequest;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * CRUD editorial + transiciones de workflow. La autorización fina (dueño vs.
 * EDITOR+, qué transición es legal desde qué estado) vive en ArticleService,
 * no aquí — este controller solo traduce HTTP ↔ dominio.
 */
@RestController
@RequestMapping("/api/v1/admin/articles")
public class ArticleAdminController {

    private final ArticleService articleService;

    public ArticleAdminController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public List<ArticleResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return articleService.listForAdmin(principal.userId(), principal.role()).stream()
                .map(ArticleResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ArticleResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.getForAdmin(id, principal.userId(), principal.role()));
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
                articleService.update(id, request.toInput(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/submit")
    public ArticleResponse submit(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.submit(id, principal.userId()));
    }

    @PostMapping("/{id}/approve")
    public ArticleResponse approve(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.approve(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/reject")
    public ArticleResponse reject(@PathVariable UUID id, @Valid @RequestBody RejectArticleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(
                articleService.reject(id, request.reason(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/publish")
    public ArticleResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.publish(id, principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/schedule")
    public ArticleResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleArticleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(
                articleService.schedule(id, request.scheduledAt(), principal.userId(), principal.role()));
    }

    @PostMapping("/{id}/archive")
    public ArticleResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.archive(id, principal.userId(), principal.role()));
    }
}
