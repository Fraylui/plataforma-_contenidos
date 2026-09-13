package pe.plataformacontenidos.shared;

import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Entrada cruda de una imagen de contenido (JSON del formulario, antes de
 * validar) — exactamente una fuente: imagen subida (imageId, módulo
 * Media) o enlace externo (externalUrl), nunca ambas ni ninguna. Cada
 * *Service (Article/Place/Event) valida la forma y, si es una imagen
 * subida, que exista en Media, antes de convertirla en ContentImage.
 */
public record ContentImageInput(UUID imageId, String externalUrl) {

    private static final Pattern HTTP_URL = Pattern.compile("^https?://.+", Pattern.CASE_INSENSITIVE);

    public boolean hasImageId() {
        return imageId != null;
    }

    public boolean hasExternalUrl() {
        return externalUrl != null && !externalUrl.isBlank();
    }

    /** Exactamente una fuente presente — ni las dos ni ninguna. */
    public boolean isValidShape() {
        return hasImageId() != hasExternalUrl();
    }

    public boolean isValidExternalUrl() {
        return hasExternalUrl() && HTTP_URL.matcher(externalUrl).matches();
    }
}
