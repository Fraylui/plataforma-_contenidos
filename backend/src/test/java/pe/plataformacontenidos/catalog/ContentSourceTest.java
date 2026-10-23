package pe.plataformacontenidos.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import pe.plataformacontenidos.identity.permission.Module;

class ContentSourceTest {

    @Test
    void buildsTheStandardReadRowFromTableAndTitleColumn() {
        ContentSource places = ContentSource.of("places.places", Module.PLACES)
                .type(ContentType.PLACE).titleColumn("name").build();

        assertThat(places.readSelect()).isEqualTo("SELECT 'PLACE'::text AS type, id, name AS title, slug, status,"
                + " created_at, published_at FROM places.places");
        assertThat(places.createdInPanel()).isTrue();
    }

    @Test
    void aSourceWithoutItsOwnTypeHasNoReadRow() {
        ContentSource series = ContentSource.of("series.series", Module.SERIES).categorized().build();

        assertThat(series.type()).isNull();
        assertThat(series.readSelect()).isNull();
    }

    @Test
    void defaultsKeepCurrentBehaviour() {
        ContentSource places = ContentSource.of("places.places", Module.PLACES).type(ContentType.PLACE).build();

        assertThat(places.inDashboard()).isTrue();
        assertThat(places.liveCondition()).isEqualTo("status = 'PUBLISHED'");
    }

    @Test
    void anEphemeralSourceCanStayOutOfTheDashboardAndDefineWhenItIsLive() {
        ContentSource stories = ContentSource.of("stories.stories", Module.STORIES).type(ContentType.STORY)
                .notInDashboard().liveCondition("expires_at > now() OR highlighted").build();

        assertThat(stories.inDashboard()).isFalse();
        assertThat(stories.liveCondition()).isEqualTo("expires_at > now() OR highlighted");
    }

    @Test
    void rejectsIdentifiersThatAreNotPlainSqlNames() {
        assertThatThrownBy(() -> ContentSource.of("places.places; drop table x", Module.PLACES).build())
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ContentSource.of("places.places", Module.PLACES).imageUrlColumns("body or 1=1").build())
                .isInstanceOf(IllegalArgumentException.class);
    }
}
