package pe.plataformacontenidos.identity.permission;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PermissionsTest {

    private static Permissions worker(Map<Module, AccessLevel> levels) {
        return new Permissions(UUID.randomUUID(), false, true, false, levels);
    }

    @Test
    void ownerCanDoEverything() {
        Permissions owner = new Permissions(UUID.randomUUID(), true, true, false, Map.of());
        for (Module module : Module.values()) {
            assertThat(owner.can(module, AccessLevel.PUBLISH)).isTrue();
            assertThat(owner.can(module, AccessLevel.ACCESS)).isTrue();
        }
    }

    @Test
    void aContentModuleMeansPublishingInIt() {
        Permissions worker = worker(Map.of(Module.EVENTS, AccessLevel.PUBLISH));
        assertThat(worker.can(Module.EVENTS, AccessLevel.PUBLISH)).isTrue();
        assertThat(worker.can(Module.PLACES, AccessLevel.PUBLISH)).isFalse();
        assertThat(worker.hasAnyContentModule()).isTrue();
    }

    @Test
    void accessModulesAndMissingRows() {
        Permissions p = worker(Map.of(Module.CATEGORIES, AccessLevel.ACCESS));
        assertThat(p.can(Module.CATEGORIES, AccessLevel.ACCESS)).isTrue();
        assertThat(p.can(Module.ADVERTISING, AccessLevel.ACCESS)).isFalse();
        assertThat(p.can(Module.ARTICLES, AccessLevel.PUBLISH)).isFalse();
        assertThat(p.hasAnyContentModule()).isFalse();
    }

    @Test
    void inactiveAccountCannotDoAnything() {
        Permissions disabled = new Permissions(UUID.randomUUID(), false, false, false, Map.of(Module.EVENTS, AccessLevel.PUBLISH));
        assertThat(disabled.can(Module.EVENTS, AccessLevel.PUBLISH)).isFalse();
        assertThat(disabled.hasAnyContentModule()).isFalse();
    }
}
