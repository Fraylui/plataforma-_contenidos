package pe.plataformacontenidos.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;
import pe.plataformacontenidos.identity.permission.Module;

class ContentRegistryTest {

    private final ContentSource places = ContentSource.of("places.places", Module.PLACES)
            .type(ContentType.PLACE).categorized().build();
    private final ContentSource series = ContentSource.of("series.series", Module.SERIES).categorized().versionsFeed().build();

    @Test
    void findsASourceByTypeAndFiltersByTrait() {
        ContentRegistry registry = new ContentRegistry(List.of(places, series));

        assertThat(registry.byType(ContentType.PLACE)).isEqualTo(places);
        assertThat(registry.where(ContentSource::categorized)).containsExactlyInAnyOrder(places, series);
        assertThat(registry.where(ContentSource::versionsFeed)).containsExactly(series);
    }

    @Test
    void anUnregisteredTypeFailsLoudly() {
        ContentRegistry registry = new ContentRegistry(List.of(places));

        assertThatThrownBy(() -> registry.byType(ContentType.GALLERY)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void twoSourcesCannotClaimTheSameTypeOrTable() {
        ContentSource otherPlaces = ContentSource.of("places.other", Module.PLACES).type(ContentType.PLACE).build();
        ContentSource samePlacesTable = ContentSource.of("places.places", Module.PLACES).build();

        assertThatThrownBy(() -> new ContentRegistry(List.of(places, otherPlaces))).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new ContentRegistry(List.of(places, samePlacesTable))).isInstanceOf(IllegalStateException.class);
    }
}
