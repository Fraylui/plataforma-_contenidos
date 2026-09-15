package pe.plataformacontenidos.content;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideoInput;

/**
 * Entrada de creación/edición de artículo, ya validada en el DTO de API.
 * Cada imagen es subida o por enlace externo (ver ContentImageInput); cada
 * video trae la URL pegada por quien redacta (sección 8) — ArticleService la
 * convierte a Video ID antes de guardar, nunca se persiste la URL cruda.
 */
public record ArticleInput(
        String title,
        String excerpt,
        String body,
        ArticleType articleType,
        UUID categoryId,
        Set<String> tagNames,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentImageInput> images,
        List<ContentVideoInput> videos,
        String robots) {
}
