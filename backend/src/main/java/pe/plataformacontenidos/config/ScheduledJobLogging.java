package pe.plataformacontenidos.config;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.boot.task.ThreadPoolTaskSchedulerCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Contexto en los logs de las tareas programadas (@Scheduled), en un solo
 * lugar y sin tocar ninguna tarea: mientras corre, cada línea lleva
 * {@code job} = «Clase.método» (como las peticiones llevan requestId, ver
 * RequestIdFilter), y si falla se registra «Falló la tarea programada X» en
 * vez del mensaje genérico de Spring. ISO 27001 A.8.15 / COBIT DSS01.
 */
@Configuration(proxyBeanMethods = false)
public class ScheduledJobLogging {

    static final String JOB_KEY = "job";

    private static final Logger log = LoggerFactory.getLogger(ScheduledJobLogging.class);

    /** Último «Clase.método» de la descripción, sin los «]» de los envoltorios de Spring. */
    private static final Pattern CLASS_AND_METHOD = Pattern.compile("([\\w$]+)\\.(\\w+)[\\]\\s]*$");

    @Bean
    ThreadPoolTaskSchedulerCustomizer scheduledJobContext() {
        return scheduler -> {
            scheduler.setTaskDecorator(task -> {
                String job = jobName(task);
                return () -> {
                    MDC.put(JOB_KEY, job);
                    try {
                        task.run();
                    } finally {
                        MDC.remove(JOB_KEY);
                    }
                };
            });
            scheduler.setErrorHandler(error -> log.error("Falló la tarea programada {}", MDC.get(JOB_KEY), error));
        };
    }

    /** «Clase.método» al final de la descripción de la tarea de Spring (ScheduledMethodRunnable, quizá envuelta). */
    static String jobName(Runnable task) {
        String description = task.toString();
        Matcher matcher = CLASS_AND_METHOD.matcher(description);
        if (!matcher.find()) {
            return description;
        }
        String className = matcher.group(1);
        return className.substring(className.lastIndexOf('$') + 1) + "." + matcher.group(2);
    }
}
