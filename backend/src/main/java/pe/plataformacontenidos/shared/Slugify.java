package pe.plataformacontenidos.shared;

import java.text.Normalizer;
import java.util.regex.Pattern;

/** Utilidad compartida (taxonomy, content, ...) para generar slugs URL-friendly a partir de un título. */
public final class Slugify {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9]+");

    private Slugify() {
    }

    public static String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String withoutDiacritics = DIACRITICS.matcher(normalized).replaceAll("");
        String lower = withoutDiacritics.toLowerCase();
        String dashed = NON_ALPHANUMERIC.matcher(lower).replaceAll("-");
        // Sin expresión regular para los bordes: "^-+|-+$" era polinómica con muchos guiones (CodeQL, ReDoS).
        int start = 0;
        int end = dashed.length();
        while (start < end && dashed.charAt(start) == '-') {
            start++;
        }
        while (end > start && dashed.charAt(end - 1) == '-') {
            end--;
        }
        return dashed.substring(start, end);
    }
}
