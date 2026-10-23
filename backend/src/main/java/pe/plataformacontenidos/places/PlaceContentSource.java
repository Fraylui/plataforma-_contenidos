package pe.plataformacontenidos.places;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.Module;

/** Ficha de Lugares para los lectores transversales (ver ContentSource). */
@Configuration(proxyBeanMethods = false)
class PlaceContentSource {

    @Bean
    ContentSource placesSource() {
        return ContentSource.of("places.places", Module.PLACES).type(ContentType.PLACE).titleColumn("name")
                .categorized().versionsFeed()
                .imagesTable("places.place_images").imageUrlColumns("body", "og_image_url")
                .build();
    }
}
