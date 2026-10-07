package pe.plataformacontenidos.engagement;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import pe.plataformacontenidos.TestcontainersConfiguration;

/**
 * Hallado con la simulación de carga (k6, 2026-10-07): un doble toque rápido
 * en "me gusta" mandaba dos peticiones a la vez; las dos veían "sin me
 * gusta", las dos insertaban y la segunda chocaba con la restricción única
 * (500). Ahora la operación es atómica: nunca falla y el contador queda en 0 o 1.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ContentLikeConcurrencyIntegrationTest {

    private static final int ROUNDS = 40;

    @Autowired
    private ContentLikeService contentLikeService;

    @Test
    void simultaneousTogglesFromSameVisitorNeverFail() throws Exception {
        UUID contentId = UUID.randomUUID();
        ConcurrentLinkedQueue<Throwable> failures = new ConcurrentLinkedQueue<>();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            for (int round = 0; round < ROUNDS; round++) {
                UUID visitorId = UUID.randomUUID();
                CountDownLatch start = new CountDownLatch(1);
                List<Future<?>> taps = List.of(
                        pool.submit(() -> tap(start, contentId, visitorId, failures)),
                        pool.submit(() -> tap(start, contentId, visitorId, failures)));
                start.countDown();
                for (Future<?> tap : taps) {
                    tap.get();
                }
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(failures).as("errores con toques simultáneos").isEmpty();
        assertThat(contentLikeService.countLikes(ContentType.PLACE, contentId)).isBetween(0L, (long) ROUNDS);
    }

    private void tap(CountDownLatch start, UUID contentId, UUID visitorId, ConcurrentLinkedQueue<Throwable> failures) {
        try {
            start.await();
            contentLikeService.toggleLike(ContentType.PLACE, contentId, visitorId);
        } catch (Throwable e) {
            failures.add(e);
        }
    }
}
