package pe.plataformacontenidos.series.api;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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

    public SeriesPublicController(SeriesService seriesService) {
        this.seriesService = seriesService;
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
        return EpisodeViewResponse.from(seriesService.publishedEpisode(slug, episodeSlug));
    }
}
