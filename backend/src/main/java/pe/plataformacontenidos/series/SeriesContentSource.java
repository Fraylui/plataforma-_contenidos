package pe.plataformacontenidos.series;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.Module;

/** Ficha de Series y sus episodios para los lectores transversales (ver ContentSource). */
@Configuration(proxyBeanMethods = false)
class SeriesContentSource {

    /**
     * Episodio: su slug público es "serie/episodio" (/series/{serie}/{episodio}),
     * así «Lo más visto» puede enlazarlo. Llega solo desde YouTube.
     */
    private static final String EPISODE_SELECT = "SELECT 'EPISODE'::text AS type, e.id, e.title AS title,"
            + " s.slug || '/' || e.slug AS slug, e.status, e.created_at, e.published_at"
            + " FROM series.episodes e JOIN series.series s ON s.id = e.series_id";

    /** La serie agrupa episodios: sin visitas propias, pero tiene tema, portada y marca la versión del feed. */
    @Bean
    ContentSource seriesSource() {
        return ContentSource.of("series.series", Module.SERIES)
                .categorized().versionsFeed()
                .imageIdColumns("cover_image_id")
                .build();
    }

    /** Un episodio nuevo u ocultado toca updated_at de su serie (Series.touchFeedVersion): no versiona el feed solo. */
    @Bean
    ContentSource episodesSource() {
        return ContentSource.of("series.episodes", Module.SERIES).type(ContentType.EPISODE)
                .readSelect(EPISODE_SELECT).notCreatedInPanel()
                .build();
    }
}
