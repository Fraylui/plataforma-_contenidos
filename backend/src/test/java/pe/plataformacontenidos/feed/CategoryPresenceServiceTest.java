package pe.plataformacontenidos.feed;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pe.plataformacontenidos.taxonomy.Category;

class CategoryPresenceServiceTest {

    private static Category category(UUID id, UUID parentId) {
        Category category = mock(Category.class);
        when(category.getId()).thenReturn(id);
        when(category.getParentId()).thenReturn(parentId);
        return category;
    }

    private final UUID cultura = UUID.randomUUID();
    private final UUID leyendas = UUID.randomUUID();
    private final UUID turismo = UUID.randomUUID();
    private final UUID vacio = UUID.randomUUID();

    @Test
    void unTemaPadreAparecePorSuSubtemaConContenido() {
        List<Category> active = List.of(category(cultura, null), category(leyendas, cultura),
                category(turismo, null), category(vacio, null));

        Set<UUID> result = CategoryPresenceService.withAncestors(Set.of(leyendas, turismo), active);

        assertThat(result).containsExactlyInAnyOrder(leyendas, cultura, turismo);
    }

    @Test
    void ignoraTemasInactivosYCortaLaCadenaEnUnPadreInactivo() {
        UUID inactivo = UUID.randomUUID();
        // "leyendas" cuelga de un padre que no está activo: se muestra el subtema, no el padre.
        List<Category> active = List.of(category(leyendas, inactivo));

        Set<UUID> result = CategoryPresenceService.withAncestors(Set.of(leyendas, inactivo, UUID.randomUUID()), active);

        assertThat(result).containsExactly(leyendas);
    }

    @Test
    void toleraCiclosEnDatosViejos() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        List<Category> active = List.of(category(a, b), category(b, a));

        assertThat(CategoryPresenceService.withAncestors(Set.of(a), active)).containsExactlyInAnyOrder(a, b);
    }

    @Test
    void sinContenidoNoHayTemas() {
        assertThat(CategoryPresenceService.withAncestors(Set.of(), List.of(category(cultura, null)))).isEmpty();
    }
}
