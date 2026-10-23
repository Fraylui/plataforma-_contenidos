package pe.plataformacontenidos.stories;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.Module;

/**
 * Ficha de Historias (ver ContentSource): visitas, me gusta y usos de su foto
 * como el resto, pero fuera del feed (sin versionsFeed), de los temas con
 * contenido (sin categorized) y de los totales del Inicio del panel.
 */
@Configuration(proxyBeanMethods = false)
class StoryContentSource {

    @Bean
    ContentSource storiesSource() {
        return ContentSource.of("stories.stories", Module.STORIES).type(ContentType.STORY).titleColumn("caption")
                .notInDashboard().liveCondition("expires_at > now() OR highlighted")
                .imageIdColumns("image_id")
                .build();
    }
}
