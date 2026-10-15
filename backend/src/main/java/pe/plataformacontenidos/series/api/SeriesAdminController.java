package pe.plataformacontenidos.series.api;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.RequiresModule;
import pe.plataformacontenidos.identity.security.UserPrincipal;
import pe.plataformacontenidos.series.Series;
import pe.plataformacontenidos.series.SeriesService;
import pe.plataformacontenidos.series.api.SeriesDtos.AddEpisodeRequest;
import pe.plataformacontenidos.series.api.SeriesDtos.CreateSeriesRequest;
import pe.plataformacontenidos.series.api.SeriesDtos.EpisodeResponse;
import pe.plataformacontenidos.series.api.SeriesDtos.SeriesResponse;
import pe.plataformacontenidos.series.api.SeriesDtos.SyncResponse;
import pe.plataformacontenidos.series.api.SeriesDtos.UpdateEpisodeRequest;
import pe.plataformacontenidos.series.api.SeriesDtos.UpdateSeriesRequest;
import pe.plataformacontenidos.shared.PageResponse;
import pe.plataformacontenidos.shared.publishing.AdminListQuery;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import pe.plataformacontenidos.shared.publishing.api.ScheduleRequest;

/** Series en el panel (módulo Series): mismo flujo de publicación que el resto + sincronizar y episodios. */
@RestController
@RequiresModule(value = Module.SERIES)
@RequestMapping("/api/v1/admin/series")
public class SeriesAdminController {

    private final SeriesService seriesService;

    public SeriesAdminController(SeriesService seriesService) {
        this.seriesService = seriesService;
    }

    @GetMapping
    public PageResponse<SeriesResponse> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) PublicationStatus status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        AdminListQuery query = new AdminListQuery(q, status, sort, page, size);
        return PageResponse.from(seriesService.listForAdmin(query), SeriesResponse::from);
    }

    @GetMapping("/{id}")
    public SeriesResponse get(@PathVariable UUID id) {
        return SeriesResponse.from(seriesService.getForAdmin(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SeriesResponse create(@Valid @RequestBody CreateSeriesRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return SeriesResponse.from(seriesService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public SeriesResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateSeriesRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return SeriesResponse.from(seriesService.update(id, request.toInput(), principal.userId()));
    }

    @PostMapping("/{id}/publish")
    public SeriesResponse publish(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return SeriesResponse.from(seriesService.publish(id, principal.userId()));
    }

    @PostMapping("/{id}/schedule")
    public SeriesResponse schedule(@PathVariable UUID id, @Valid @RequestBody ScheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return SeriesResponse.from(seriesService.schedule(id, request.scheduledAt(), principal.userId()));
    }

    @PostMapping("/{id}/return-to-draft")
    public SeriesResponse returnToDraft(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return SeriesResponse.from(seriesService.returnToDraft(id, principal.userId()));
    }

    @PostMapping("/{id}/archive")
    public SeriesResponse archive(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return SeriesResponse.from(seriesService.archive(id, principal.userId()));
    }

    /** "Sincronizar ahora": trae ya los videos nuevos de la lista sin esperar la pasada de 30 minutos. */
    @PostMapping("/{id}/sync")
    public SyncResponse sync(@PathVariable UUID id) {
        int added = seriesService.sync(id);
        Series series = seriesService.getForAdmin(id);
        return new SyncResponse(added, series.getLastSyncedAt(), series.getLastSyncError());
    }

    @GetMapping("/{id}/episodes")
    public PageResponse<EpisodeResponse> episodes(@PathVariable UUID id, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100));
        return PageResponse.from(seriesService.episodesForAdmin(id, pageable), EpisodeResponse::from);
    }

    @PostMapping("/{id}/episodes")
    @ResponseStatus(HttpStatus.CREATED)
    public EpisodeResponse addEpisode(@PathVariable UUID id, @Valid @RequestBody AddEpisodeRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return EpisodeResponse.from(seriesService.addEpisode(id, request.videoUrl(), request.title(),
                request.description(), request.publishedAt(), principal.userId()));
    }

    @PutMapping("/{id}/episodes/{episodeId}")
    public EpisodeResponse updateEpisode(@PathVariable UUID id, @PathVariable UUID episodeId,
            @Valid @RequestBody UpdateEpisodeRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return EpisodeResponse.from(seriesService.updateEpisode(id, episodeId, request.title(), request.notes(),
                principal.userId()));
    }

    @PostMapping("/{id}/episodes/{episodeId}/archive")
    public EpisodeResponse archiveEpisode(@PathVariable UUID id, @PathVariable UUID episodeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return EpisodeResponse.from(seriesService.setEpisodeArchived(id, episodeId, true, principal.userId()));
    }

    @PostMapping("/{id}/episodes/{episodeId}/restore")
    public EpisodeResponse restoreEpisode(@PathVariable UUID id, @PathVariable UUID episodeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return EpisodeResponse.from(seriesService.setEpisodeArchived(id, episodeId, false, principal.userId()));
    }
}
