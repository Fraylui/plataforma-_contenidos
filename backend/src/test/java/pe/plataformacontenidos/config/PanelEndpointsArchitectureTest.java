package pe.plataformacontenidos.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.permission.OwnerOnlyPaths;
import pe.plataformacontenidos.identity.permission.RequiresModule;

/**
 * Ningún endpoint del panel queda abierto por olvido (spec 2a §4.1): todo
 * handler bajo /api/v1/admin/ declara @RequiresModule o es solo del dueño.
 * Imágenes es la excepción documentada: cualquier usuario activo del panel.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class PanelEndpointsArchitectureTest {

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    private final AntPathMatcher matcher = new AntPathMatcher();

    @Test
    void everyPanelEndpointDeclaresItsModuleOrIsOwnerOnly() {
        List<String> unprotected = handlerMapping.getHandlerMethods().entrySet().stream()
                .flatMap(e -> e.getKey().getPatternValues().stream().map(pattern -> new Object[] { pattern, e.getValue() }))
                .filter(pair -> ((String) pair[0]).startsWith("/api/v1/admin/"))
                .filter(pair -> !((String) pair[0]).startsWith("/api/v1/admin/images"))
                .filter(pair -> OwnerOnlyPaths.PATTERNS.stream().noneMatch(p -> matcher.match(p, (String) pair[0])))
                .filter(pair -> {
                    var method = (org.springframework.web.method.HandlerMethod) pair[1];
                    return !method.hasMethodAnnotation(RequiresModule.class)
                            && !method.hasMethodAnnotation(pe.plataformacontenidos.identity.permission.RequiresAnyModule.class)
                            && !AnnotatedElementUtils.hasAnnotation(method.getBeanType(), RequiresModule.class);
                })
                .map(pair -> (String) pair[0])
                .sorted()
                .toList();

        assertThat(unprotected).as("endpoints del panel sin @RequiresModule").isEmpty();
    }
}
