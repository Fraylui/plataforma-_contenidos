package pe.plataformacontenidos.shared.publishing;

import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Fuentes de un post: enlaces http(s) que se muestran al final («Fuentes: …»).
 * Hasta {@link #MAX}; se guardan en una columna de texto, uno por línea.
 * Sin formato académico: la ley solo pide autor y fuente (D.Leg. 822 art. 44).
 */
public final class PostSources {

    public static final int MAX = 10;
    static final int MAX_URL = 2048;

    private PostSources() {
    }

    /** Valida, quita vacíos y repetidos, y devuelve la columna (null si no hay ninguna). */
    public static String toColumn(List<String> sources) {
        if (sources == null) {
            return null;
        }
        List<String> clean = new ArrayList<>();
        for (String source : sources) {
            String url = source == null ? "" : source.strip();
            if (url.isEmpty() || clean.contains(url)) {
                continue;
            }
            if (!isValidUrl(url)) {
                throw new InvalidSourceException(url);
            }
            clean.add(url);
        }
        if (clean.size() > MAX) {
            throw new InvalidSourceException(null);
        }
        return clean.isEmpty() ? null : String.join("\n", clean);
    }

    public static List<String> fromColumn(String column) {
        return column == null || column.isBlank() ? List.of() : Arrays.stream(column.split("\n")).toList();
    }

    static boolean isValidUrl(String url) {
        if (url.length() > MAX_URL || url.chars().anyMatch(Character::isWhitespace)) {
            return false;
        }
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            return ("https".equals(scheme) || "http".equals(scheme)) && uri.getHost() != null
                    && uri.getHost().contains(".") && uri.getUserInfo() == null;
        } catch (Exception ex) {
            return false;
        }
    }
}
