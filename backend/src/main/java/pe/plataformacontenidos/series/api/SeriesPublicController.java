package pe.plataformacontenidos.series.api;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.engagement.ContentLikeService;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.engagement.LikeResponse;
import pe.plataformacontenidos.series.Episode;
import pe.plataformacontenidos.series.Series;
import pe.plataformacontenidos.series.SeriesService;
import pe.plataformacontenidos.series.api.SeriesDtos.EpisodeResponse;
import pe.plataformacontenidos.series.api.SeriesDtos.EpisodeViewResponse;
import pe.plataformacontenidos.series.api.SeriesDtos.PublicSeriesResponse;
import pe.plataformacontenidos.series.api.SeriesDtos.SeriesCardResponse;
import pe.plataformacontenidos.shared.PageResponse;

/** Público (SecurityConfig): series publicadas y sus episodios publicados. */
@RestController
@RequestMapping("/api/v1/series")
public class SeriesPublicController {

    private final SeriesService seriesService;
    private final ContentLikeService contentLikeService;

    public SeriesPublicController(SeriesService seriesService, ContentLikeService contentLikeService) {
        this.seriesService = seriesService;
        this.contentLikeService = contentLikeService;
    }

    /** Las series con actividad más reciente primero (un episodio nuevo actualiza la serie). */
    @GetMapping
    public PageResponse<SeriesCardResponse> list(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 48), Sort.by(Sort.Direction.DESC, "updatedAt"));
        return PageResponse.from(seriesService.listPublished(pageable), SeriesCardResponse::from);
    }

    @GetMapping("/{slug}")
    public PublicSeriesResponse get(@PathVariable String slug) {
        return PublicSeriesResponse.from(seriesService.getPublishedBySlug(slug));
    }

    @GetMapping("/{slug}/episodes")
    public PageResponse<EpisodeResponse> episodes(@PathVariable String slug, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        Series series = seriesService.getPublishedBySlug(slug);
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 48));
        return PageResponse.from(seriesService.publishedEpisodes(series, pageable), EpisodeResponse::from);
    }

    @GetMapping("/{slug}/episodes/{episodeSlug}")
    public EpisodeViewResponse episode(@PathVariable String slug, @PathVariable String episodeSlug) {
        SeriesService.EpisodeView view = seriesService.publishedEpisode(slug, episodeSlug);
        return EpisodeViewResponse.from(view, contentLikeService.countLikes(ContentType.EPISODE, view.episode().getId()));
    }

    /** "Me gusta" anónimo de un episodio (mismo mecanismo que el resto, ver ContentLike); por id, el slug solo es único dentro de su serie. */
    @PostMapping("/episodes/{episodeId}/like")
    public LikeResponse toggleLike(@PathVariable UUID episodeId, @RequestParam UUID visitorId) {
        Episode episode = seriesService.getPublishedEpisode(episodeId);
        return LikeResponse.from(contentLikeService.toggleLike(ContentType.EPISODE, episode.getId(), visitorId));
    }
}
