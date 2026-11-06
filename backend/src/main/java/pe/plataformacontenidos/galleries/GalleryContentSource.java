package pe.plataformacontenidos.galleries;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.Module;

/** Ficha de Galerías para los lectores transversales (ver ContentSource). */
@Configuration(proxyBeanMethods = false)
class GalleryContentSource {

    @Bean
    ContentSource galleriesSource() {
        return ContentSource.of("galleries.galleries", Module.GALLERIES).type(ContentType.GALLERY)
                .categorized().versionsFeed()
                .imagesTable("galleries.gallery_images").imageUrlColumns("og_image_url")
                .build();
    }
}
