package pe.plataformacontenidos.shared;

/**
 * Entrada cruda de un video (JSON del formulario, antes de validar) — la URL
 * pegada por quien redacta más título/pie de foto opcionales (el título
 * suele venir autorrellenado por oEmbed de YouTube en el frontend). El
 * *Service correspondiente convierte la URL en Video ID antes de guardar.
 */
public record ContentVideoInput(String url, String title, String caption) {
}
