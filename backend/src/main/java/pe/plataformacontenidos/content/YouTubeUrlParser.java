package pe.plataformacontenidos.content;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extrae el Video ID de una URL de YouTube (CONTEXTO.md sección 8). Nunca
 * se descarga ni se aloja el video: solo se guarda la referencia y el
 * frontend embebe el reproductor de YouTube con ese ID.
 */
public final class YouTubeUrlParser {

    private static final Pattern VIDEO_ID = Pattern.compile("^[a-zA-Z0-9_-]{11}$");

    private static final Pattern[] URL_PATTERNS = {
            Pattern.compile("(?:youtube\\.com/watch\\?v=)([a-zA-Z0-9_-]{11})"),
            Pattern.compile("(?:youtu\\.be/)([a-zA-Z0-9_-]{11})"),
            Pattern.compile("(?:youtube\\.com/embed/)([a-zA-Z0-9_-]{11})"),
            Pattern.compile("(?:youtube\\.com/shorts/)([a-zA-Z0-9_-]{11})"),
    };

    private YouTubeUrlParser() {
    }

    public static Optional<String> extractVideoId(String url) {
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }
        for (Pattern pattern : URL_PATTERNS) {
            Matcher matcher = pattern.matcher(url);
            if (matcher.find()) {
                return Optional.of(matcher.group(1));
            }
        }
        return Optional.empty();
    }

    public static boolean isValidVideoId(String videoId) {
        return videoId != null && VIDEO_ID.matcher(videoId).matches();
    }
}
