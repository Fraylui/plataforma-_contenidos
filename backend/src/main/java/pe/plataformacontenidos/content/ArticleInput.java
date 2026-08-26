package pe.plataformacontenidos.content;

import java.util.Set;
import java.util.UUID;

/**
 * Entrada de creación/edición de artículo, ya validada en el DTO de API.
 * geographyId y youtubeUrl son opcionales. youtubeUrl es la URL pegada por
 * el redactor (sección 8) — ArticleService la convierte al Video ID antes
 * de guardar; nunca se persiste la URL cruda.
 */
public record ArticleInput(
        String title,
        String excerpt,
        String body,
        ArticleType articleType,
        UUID categoryId,
        UUID geographyId,
        Set<String> tagNames,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String youtubeUrl,
        String robots) {
}
