package pe.plataformacontenidos.identity.permission;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.content.ArticleService;
import pe.plataformacontenidos.directory.BusinessService;
import pe.plataformacontenidos.events.EventService;
import pe.plataformacontenidos.galleries.GalleryService;
import pe.plataformacontenidos.places.PlaceService;

/**
 * Spec 2a, criterio 2: con nivel CREATE nunca se aprueba, rechaza, publica,
 * programa ni archiva — en los 5 tipos. La regla se evalúa antes de buscar
 * el contenido, así que basta un id cualquiera. El camino con PUBLISH lo
 * cubren los *WorkflowIntegrationTest.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ContentPublishPermissionIntegrationTest {

    @Autowired private ArticleService articles;
    @Autowired private PlaceService places;
    @Autowired private EventService events;
    @Autowired private GalleryService galleries;
    @Autowired private BusinessService businesses;

    private static final UUID ANY = UUID.randomUUID();
    private static final UUID ME = UUID.randomUUID();
    private static final Instant LATER = Instant.now().plusSeconds(3600);

    Stream<Consumer<Boolean>> publishActions() {
        return List.<Consumer<Boolean>>of(
                can -> articles.approve(ANY, ME, can), can -> articles.reject(ANY, "x", ME, can),
                can -> articles.publish(ANY, ME, can), can -> articles.schedule(ANY, LATER, ME, can),
                can -> articles.archive(ANY, ME, can),
                can -> places.approve(ANY, ME, can), can -> places.publish(ANY, ME, can),
                can -> places.schedule(ANY, LATER, ME, can), can -> places.archive(ANY, ME, can),
                can -> events.approve(ANY, ME, can), can -> events.publish(ANY, ME, can),
                can -> events.schedule(ANY, LATER, ME, can), can -> events.archive(ANY, ME, can),
                can -> galleries.approve(ANY, ME, can), can -> galleries.publish(ANY, ME, can),
                can -> galleries.schedule(ANY, LATER, ME, can), can -> galleries.archive(ANY, ME, can),
                can -> businesses.approve(ANY, ME, can), can -> businesses.publish(ANY, ME, can),
                can -> businesses.schedule(ANY, LATER, ME, can), can -> businesses.archive(ANY, ME, can)).stream();
    }

    @ParameterizedTest
    @MethodSource("publishActions")
    void createLevelCannotRunPublishingActions(Consumer<Boolean> action) {
        assertThatThrownBy(() -> action.accept(false)).isInstanceOf(PublishPermissionRequiredException.class);
    }
}
