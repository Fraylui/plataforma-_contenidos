package pe.plataformacontenidos.advertising;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import org.junit.jupiter.api.Test;

class CampaignTargetingTest {

    private static final UUID TURISMO = UUID.randomUUID();
    private static final UUID GASTRONOMIA = UUID.randomUUID(); // hija de Turismo
    private static final UUID TECNOLOGIA = UUID.randomUUID();
    private static final Map<UUID, Set<UUID>> LINEAGE = Map.of(
            TURISMO, Set.of(TURISMO), GASTRONOMIA, Set.of(GASTRONOMIA, TURISMO), TECNOLOGIA, Set.of(TECNOLOGIA));
    private static final Function<UUID, Set<UUID>> LINEAGE_OF = LINEAGE::get;

    private static CampaignTargeting targeting(List<AdSection> sections, List<UUID> categories, List<String> countries,
            List<String> regions) {
        return CampaignTargeting.of(sections, categories, countries, regions);
    }

    @Test
    void emptyTargetingRunsEverywhere() {
        assertThat(CampaignTargeting.EVERYWHERE.matches(AdContext.NONE)).isTrue();
        assertThat(CampaignTargeting.EVERYWHERE.specificity()).isZero();
    }

    @Test
    void topicIncludesItsSubtopics() {
        var turismo = targeting(List.of(), List.of(TURISMO), List.of(), List.of());
        var onGastronomyPage = new AdContext(AdSection.ARTICLE, LINEAGE.get(GASTRONOMIA), null, null, null);
        var onTechPage = new AdContext(AdSection.ARTICLE, LINEAGE.get(TECNOLOGIA), null, null, null);
        assertThat(turismo.matches(onGastronomyPage)).isTrue();
        assertThat(turismo.matches(onTechPage)).isFalse();
        assertThat(turismo.matches(AdContext.NONE)).isFalse();
    }

    @Test
    void sectionAndVisitorLocationMustAllMatch() {
        var ayacuchoPlaces = targeting(List.of(AdSection.PLACE), List.of(), List.of("pe"), List.of("Región de Ayacucho"));
        assertThat(ayacuchoPlaces.specificity()).isEqualTo(3);
        assertThat(ayacuchoPlaces.matches(new AdContext(AdSection.PLACE, Set.of(), "PE", "Ayacucho", "AYA"))).isTrue();
        assertThat(ayacuchoPlaces.matches(new AdContext(AdSection.PLACE, Set.of(), "PE", "Lima", "LIM"))).isFalse();
        assertThat(ayacuchoPlaces.matches(new AdContext(AdSection.EVENT, Set.of(), "PE", "Ayacucho", "AYA"))).isFalse();
        // Sin cabeceras de Cloudflare (local): una campaña geográfica no se muestra.
        assertThat(ayacuchoPlaces.matches(new AdContext(AdSection.PLACE, Set.of(), null, null, null))).isFalse();
    }

    @Test
    void regionMatchesByCodeAndIgnoresAccentsAndNoise() {
        var lima = targeting(List.of(), List.of(), List.of(), List.of("LIM"));
        assertThat(lima.matches(new AdContext(null, Set.of(), "PE", "Lima Region", "LIM"))).isTrue();
        var junin = targeting(List.of(), List.of(), List.of(), List.of("Junín"));
        assertThat(junin.matches(new AdContext(null, Set.of(), "PE", "Junin", "JUN"))).isTrue();
    }

    @Test
    void campaignsCompeteOnlyWhenEveryDimensionOverlaps() {
        var restaurant = targeting(List.of(), List.of(GASTRONOMIA), List.of(), List.of());
        var tourismAll = targeting(List.of(), List.of(TURISMO), List.of(), List.of());
        var tech = targeting(List.of(), List.of(TECNOLOGIA), List.of(), List.of());
        assertThat(restaurant.overlaps(tourismAll, LINEAGE_OF)).isTrue(); // Gastronomía está dentro de Turismo
        assertThat(restaurant.overlaps(tech, LINEAGE_OF)).isFalse();
        assertThat(restaurant.overlaps(CampaignTargeting.EVERYWHERE, LINEAGE_OF)).isTrue();
        var limaOnly = targeting(List.of(), List.of(), List.of(), List.of("Lima"));
        var ayacuchoOnly = targeting(List.of(), List.of(), List.of(), List.of("Ayacucho"));
        assertThat(limaOnly.overlaps(ayacuchoOnly, LINEAGE_OF)).isFalse();
    }

    @Test
    void rejectsInvalidCountryCodes() {
        assertThatThrownBy(() -> targeting(List.of(), List.of(), List.of("Perú"), List.of()))
                .isInstanceOf(InvalidCampaignTargetingException.class);
    }
}
