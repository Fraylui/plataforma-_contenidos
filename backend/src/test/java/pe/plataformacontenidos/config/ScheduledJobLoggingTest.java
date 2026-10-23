package pe.plataformacontenidos.config;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.ScheduledMethodRunnable;

class ScheduledJobLoggingTest {

    /** Tarea de ejemplo, como las @Scheduled reales. */
    static class SampleJob {
        final CountDownLatch ran = new CountDownLatch(1);
        final AtomicReference<String> jobInContext = new AtomicReference<>();

        public void publishDue() {
            jobInContext.set(MDC.get(ScheduledJobLogging.JOB_KEY));
            ran.countDown();
            throw new IllegalStateException("la base no responde");
        }
    }

    private final ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
    private final ListAppender<ILoggingEvent> logs = new ListAppender<>();
    private final Logger logger = (Logger) LoggerFactory.getLogger(ScheduledJobLogging.class);

    @BeforeEach
    void setUp() {
        new ScheduledJobLogging().scheduledJobContext().customize(scheduler);
        scheduler.initialize();
        logs.start();
        logger.addAppender(logs);
    }

    @AfterEach
    void tearDown() {
        logger.detachAppender(logs);
        scheduler.shutdown();
    }

    @Test
    void aFailingJobIsLoggedWithItsNameAndItsLogsCarryTheJob() throws Exception {
        SampleJob job = new SampleJob();

        scheduler.schedule(new ScheduledMethodRunnable(job, SampleJob.class.getMethod("publishDue")), Instant.now());

        assertThat(job.ran.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(job.jobInContext.get()).isEqualTo("SampleJob.publishDue");
        ILoggingEvent failure = awaitFailureLog();
        assertThat(failure.getFormattedMessage()).isEqualTo("Falló la tarea programada SampleJob.publishDue");
        assertThat(failure.getThrowableProxy().getMessage()).isEqualTo("la base no responde");
    }

    private ILoggingEvent awaitFailureLog() throws InterruptedException {
        for (int i = 0; i < 50; i++) {
            if (!logs.list.isEmpty()) {
                return logs.list.get(0);
            }
            Thread.sleep(100);
        }
        throw new AssertionError("La falla no se registró");
    }
}
