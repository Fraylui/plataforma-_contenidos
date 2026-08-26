package pe.plataformacontenidos.content;

import java.util.Set;
import java.util.UUID;

/** Entrada de creación/edición de artículo, ya validada en el DTO de API. geographyId es opcional. */
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
        String robots) {
}
