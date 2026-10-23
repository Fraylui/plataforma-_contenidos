package pe.plataformacontenidos.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.test.context.ActiveProfiles;
import pe.plataformacontenidos.TestcontainersConfiguration;

/** El planificador que usan las @Scheduled de verdad pone el nombre de la tarea en los logs. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ScheduledJobLoggingIntegrationTest {

    @Autowired
    private TaskScheduler taskScheduler;

    @Test
    void theApplicationSchedulerPutsTheJobInTheLogContext() throws Exception {
        CompletableFuture<String> job = new CompletableFuture<>();

        taskScheduler.schedule(new Runnable() {
            @Override
            public void run() {
                job.complete(MDC.get(ScheduledJobLogging.JOB_KEY));
            }

            @Override
            public String toString() {
                return "pe.plataformacontenidos.content.ScheduledPublishJob.publishDue";
            }
        }, Instant.now());

        assertThat(job.get(10, TimeUnit.SECONDS)).isEqualTo("ScheduledPublishJob.publishDue");
    }
}
