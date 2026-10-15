package pe.plataformacontenidos.content.api;

import org.springframework.web.bind.annotation.RequestParam;
import pe.plataformacontenidos.content.Article;
import pe.plataformacontenidos.engagement.AdminContentPage;
import pe.plataformacontenidos.engagement.ContentEngagementService;
import pe.plataformacontenidos.engagement.ContentType;
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
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * CRUD de contenido + transiciones del flujo. La autorización fina (máquina
 * de estados, qué transición es legal desde qué estado) vive en ArticleService,
 * no aquí — este controller solo traduce HTTP ↔ dominio.
 */
@RestController
@RequiresModule(value = Module.ARTICLES)
@RequestMapping("/api/v1/admin/articles")
public class ArticleAdminController {

    private final ContentEngagementService engagementService;

    private final ArticleService articleService;

    public ArticleAdminController(ArticleService articleService,
            ContentEngagementService engagementService) {
        this.engagementService = engagementService;
        this.articleService = articleService;
    }

    /** Paginado en el servidor: búsqueda por título, estado, orden y página (ver AdminListQuery). */
    @GetMapping
    public AdminContentPage<ArticleResponse> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) PublicationStatus status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminListQuery query = new AdminListQuery(q, status, sort, page, size);
        return AdminContentPage.from(articleService.listForAdmin(query),
                ArticleResponse::from, Article::getId, ContentType.ARTICLE, engagementService);
    }

    @GetMapping("/{id}")
    public ArticleResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.getForAdmin(id));
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
                articleService.update(id, request.toInput(), principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public ArticleResponse returnToDraft(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.returnToDraft(id, principal.userId()));
    }

    @PostMapping("/{id}/publish")
    public ArticleResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.publish(id, principal.userId()));
    }

    @PostMapping("/{id}/schedule")
    public ArticleResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(
                articleService.schedule(id, request.scheduledAt(), principal.userId()));
    }

    @PostMapping("/{id}/archive")
    public ArticleResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return ArticleResponse.from(articleService.archive(id, principal.userId()));
    }

}
