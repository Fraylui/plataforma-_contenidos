package pe.plataformacontenidos.content;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.Module;

/** Ficha de Publicaciones para los lectores transversales (ver ContentSource). */
@Configuration(proxyBeanMethods = false)
class PublicationContentSource {

    @Bean
    ContentSource publicationsSource() {
        return ContentSource.of("content.publications", Module.PUBLICATIONS).type(ContentType.PUBLICATION)
                .categorized().versionsFeed()
                .imagesTable("content.publication_images").imageUrlColumns("body", "og_image_url")
                .build();
    }
}
