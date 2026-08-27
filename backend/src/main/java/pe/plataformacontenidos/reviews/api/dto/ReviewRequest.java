package pe.plataformacontenidos.reviews.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.reviews.ReviewInput;

public record ReviewRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 500) String excerpt,
        @NotBlank String body,
        @NotNull UUID categoryId,
        UUID geographyId,
        UUID placeId,
        @Size(max = 200) String subjectName,
        @Min(1) @Max(5) int rating,
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String youtubeUrl,
        String robots) {

    public ReviewInput toInput() {
        return new ReviewInput(title, excerpt, body, categoryId, geographyId, placeId, subjectName, rating,
                imageIds, seoTitle, metaDescription, canonicalUrl, ogImageUrl, youtubeUrl, robots);
    }
}
