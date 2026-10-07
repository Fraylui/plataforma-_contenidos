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
            assertThat(owner.can(module, AccessLevel.CREATE)).isTrue();
            assertThat(owner.canPublish(module)).isTrue();
        }
    }

    @Test
    void publishImpliesCreateButNotTheOtherWayAround() {
        Permissions publisher = worker(Map.of(Module.EVENTS, AccessLevel.PUBLISH));
        assertThat(publisher.can(Module.EVENTS, AccessLevel.CREATE)).isTrue();
        assertThat(publisher.canPublish(Module.EVENTS)).isTrue();

        Permissions creator = worker(Map.of(Module.EVENTS, AccessLevel.CREATE));
        assertThat(creator.can(Module.EVENTS, AccessLevel.CREATE)).isTrue();
        assertThat(creator.can(Module.EVENTS, AccessLevel.PUBLISH)).isFalse();
        assertThat(creator.canPublish(Module.EVENTS)).isFalse();
    }

    @Test
    void accessModulesAndMissingRows() {
        Permissions p = worker(Map.of(Module.CATEGORIES, AccessLevel.ACCESS));
        assertThat(p.can(Module.CATEGORIES, AccessLevel.ACCESS)).isTrue();
        assertThat(p.can(Module.ADVERTISING, AccessLevel.ACCESS)).isFalse();
        assertThat(p.can(Module.ARTICLES, AccessLevel.CREATE)).isFalse();
    }

    @Test
    void inactiveAccountCannotDoAnything() {
        Permissions disabled = new Permissions(UUID.randomUUID(), false, false, false, Map.of(Module.EVENTS, AccessLevel.PUBLISH));
        assertThat(disabled.can(Module.EVENTS, AccessLevel.CREATE)).isFalse();
        assertThat(disabled.canPublish(Module.EVENTS)).isFalse();
    }
}
