package pe.plataformacontenidos.celebrations;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.Module;

/** Ficha de Celebraciones para los lectores transversales (ver ContentSource). */
@Configuration(proxyBeanMethods = false)
class CelebrationContentSource {

    @Bean
    ContentSource celebrationsSource() {
        return ContentSource.of("celebrations.celebrations", Module.CELEBRATIONS).type(ContentType.CELEBRATION)
                .categorized().versionsFeed()
                .imagesTable("celebrations.celebration_images").imageUrlColumns("body", "og_image_url")
                .build();
    }
}
