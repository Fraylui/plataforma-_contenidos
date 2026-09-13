package pe.plataformacontenidos.content.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import pe.plataformacontenidos.content.ArticleInput;
import pe.plataformacontenidos.content.ArticleType;
import pe.plataformacontenidos.shared.ContentImageInput;

public record ArticleRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 500) String excerpt,
        @NotBlank String body,
        @NotNull ArticleType articleType,
        @NotNull UUID categoryId,
        UUID geographyId,
        Set<String> tagNames,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentImageInput> images,
        List<String> youtubeUrls,
        String robots) {

    public ArticleInput toInput() {
        return new ArticleInput(title, excerpt, body, articleType, categoryId, geographyId, tagNames, seoTitle,
                metaDescription, canonicalUrl, ogImageUrl, images == null ? List.of() : images,
                youtubeUrls == null ? List.of() : youtubeUrls, robots);
    }
}
