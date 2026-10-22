package pe.plataformacontenidos;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/**
 * Límites entre módulos (Spring Modulith): cada paquete de primer nivel es un
 * módulo; otro módulo solo puede usar lo que este expone, y no puede haber
 * ciclos entre módulos. Falla el CI si alguien se mete por dentro de otro.
 */
class ModularityTest {

    private static final ApplicationModules MODULES = ApplicationModules.of(BackendApplication.class);

    @Test
    void modulesRespectTheirBoundariesAndHaveNoCycles() {
        MODULES.verify();
    }
}
