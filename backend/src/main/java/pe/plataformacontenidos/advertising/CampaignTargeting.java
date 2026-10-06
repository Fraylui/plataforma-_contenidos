package pe.plataformacontenidos.advertising;

import java.text.Normalizer;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;

/**
 * Segmentación de una campaña. Cada dimensión vacía = sin restricción
 * ("en todo el sitio", "en todos los temas", "en cualquier país").
 *
 * @param sections    secciones del sitio
 * @param categoryIds temas (cada uno incluye sus subtemas)
 * @param countries   país del visitante, ISO 3166-1 alfa-2 en mayúsculas ("PE")
 * @param regions     región del visitante, como la escribió el admin ("Ayacucho"); se compara normalizada
 */
public record CampaignTargeting(Set<AdSection> sections, Set<UUID> categoryIds, Set<String> countries,
        Set<String> regions) {

    public static final CampaignTargeting EVERYWHERE = new CampaignTargeting(Set.of(), Set.of(), Set.of(), Set.of());

    private static final Pattern MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern REGION_NOISE = Pattern.compile(
            "^(region|departamento|department|provincia|province|estado|state)( de)? | (region|department|province)$");

    public CampaignTargeting {
        sections = Set.copyOf(sections);
        categoryIds = Set.copyOf(categoryIds);
        countries = Set.copyOf(countries);
        regions = Set.copyOf(regions);
    }

    /** ¿Esta campaña puede mostrarse en ese contexto? */
    public boolean matches(AdContext context) {
        return (sections.isEmpty() || sections.contains(context.section()))
                && (categoryIds.isEmpty() || categoryIds.stream().anyMatch(context.categoryLineage()::contains))
                && (countries.isEmpty() || (context.country() != null
                        && countries.contains(context.country().toUpperCase(Locale.ROOT))))
                && (regions.isEmpty() || regions.stream().map(CampaignTargeting::normalizeRegion)
                        .anyMatch(r -> r.equals(normalizeRegion(context.region()))
                                || r.equals(normalizeRegion(context.regionCode()))));
    }

    /**
     * Cuántas dimensiones restringe: en una página donde calza, la campaña
     * más específica va antes que la general (un restaurante que eligió
     * Gastronomía, en una página de Gastronomía, antes que un anuncio para
     * todo el sitio).
     */
    public int specificity() {
        return (sections.isEmpty() ? 0 : 1) + (categoryIds.isEmpty() ? 0 : 1) + (countries.isEmpty() ? 0 : 1)
                + (regions.isEmpty() ? 0 : 1);
    }

    /**
     * ¿Compiten por el mismo público? Sí, si en TODAS las dimensiones se
     * cruzan (vacío se cruza con todo). Los temas se cruzan si son el mismo o
     * uno contiene al otro (`lineage`: el tema y sus ancestros).
     */
    public boolean overlaps(CampaignTargeting other, Function<UUID, Set<UUID>> lineage) {
        return intersects(sections, other.sections)
                && intersects(countries, other.countries)
                && intersectsNormalized(regions, other.regions)
                && categoriesOverlap(categoryIds, other.categoryIds, lineage);
    }

    private static <T> boolean intersects(Set<T> a, Set<T> b) {
        return a.isEmpty() || b.isEmpty() || a.stream().anyMatch(b::contains);
    }

    private static boolean intersectsNormalized(Set<String> a, Set<String> b) {
        return a.isEmpty() || b.isEmpty()
                || a.stream().map(CampaignTargeting::normalizeRegion)
                        .anyMatch(r -> b.stream().map(CampaignTargeting::normalizeRegion).anyMatch(r::equals));
    }

    private static boolean categoriesOverlap(Set<UUID> a, Set<UUID> b, Function<UUID, Set<UUID>> lineage) {
        if (a.isEmpty() || b.isEmpty()) {
            return true;
        }
        for (UUID x : a) {
            for (UUID y : b) {
                if (lineage.apply(x).contains(y) || lineage.apply(y).contains(x)) {
                    return true;
                }
            }
        }
        return false;
    }

    /** "Región de Ayacucho" / "Ayacucho Region" / "ayacucho" → "ayacucho". */
    static String normalizeRegion(String value) {
        if (value == null) {
            return "";
        }
        String plain = MARKS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD)).replaceAll("")
                .toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
        return REGION_NOISE.matcher(plain).replaceAll("").trim();
    }

    /** Limpia lo que llega del panel: países en mayúsculas, regiones sin espacios sobrantes, sin repetidos. */
    public static CampaignTargeting of(Collection<AdSection> sections, Collection<UUID> categoryIds,
            Collection<String> countries, Collection<String> regions) {
        Set<String> cleanCountries = new LinkedHashSet<>();
        for (String country : nullSafe(countries)) {
            String code = country.trim().toUpperCase(Locale.ROOT);
            if (!code.matches("[A-Z]{2}")) {
                throw new InvalidCampaignTargetingException(
                        "País inválido: «" + country + "». Usa el código de 2 letras (PE, CO, MX…).");
            }
            cleanCountries.add(code);
        }
        Set<String> cleanRegions = new LinkedHashSet<>();
        for (String region : nullSafe(regions)) {
            String trimmed = region.trim().replaceAll("\\s+", " ");
            if (!trimmed.isEmpty()) {
                cleanRegions.add(trimmed);
            }
        }
        return new CampaignTargeting(new LinkedHashSet<>(nullSafe(sections)), new LinkedHashSet<>(nullSafe(categoryIds)),
                cleanCountries, cleanRegions);
    }

    private static <T> Collection<T> nullSafe(Collection<T> values) {
        return values == null ? Set.of() : values;
    }
}
