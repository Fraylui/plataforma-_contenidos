package pe.plataformacontenidos.shared;

import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Entrada cruda de una imagen de contenido (JSON del formulario, antes de
 * validar) — exactamente una fuente: imagen subida (imageId, módulo
 * Media) o enlace externo (externalUrl), nunca ambas ni ninguna. Cada
 * *Service (Publication/Place/Celebration) valida la forma y, si es una imagen
 * subida, que exista en Media, antes de convertirla en ContentImage.
 */
public record ContentImageInput(UUID imageId, String externalUrl, String title, String caption, String credit,
        Boolean rightsConfirmed) {

    static final int MAX_CREDIT = 120;

    /** Compatibilidad: sin crédito (foto propia). */
    public ContentImageInput(UUID imageId, String externalUrl, String title, String caption) {
        this(imageId, externalUrl, title, caption, null, null);
    }

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

    /** Crédito limpio, o null si no hay (foto propia). */
    public String cleanCredit() {
        return credit == null || credit.isBlank() ? null : credit.strip();
    }

    /**
     * Con crédito (foto de otra persona) hace falta confirmar el permiso por
     * escrito o la licencia libre; y el crédito tiene un largo máximo.
     */
    public boolean hasValidCredit() {
        String clean = cleanCredit();
        return clean == null || (clean.length() <= MAX_CREDIT && Boolean.TRUE.equals(rightsConfirmed));
    }

    /** Convierte a ContentImage con su crédito (después de validar). */
    public ContentImage toContentImage() {
        ContentImage base = hasImageId() ? ContentImage.uploaded(imageId, title, caption)
                : ContentImage.external(externalUrl, title, caption);
        return base.withCredit(cleanCredit(), Boolean.TRUE.equals(rightsConfirmed));
    }
}
