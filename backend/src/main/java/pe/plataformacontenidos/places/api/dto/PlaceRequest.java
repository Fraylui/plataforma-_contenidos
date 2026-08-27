package pe.plataformacontenidos.places.api.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.places.PlaceInput;

public record PlaceRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 500) String excerpt,
        @NotBlank String body,
        @NotNull UUID categoryId,
        UUID geographyId,
        @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @DecimalMin("-180") @DecimalMax("180") Double longitude,
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String youtubeUrl,
        String robots) {

    public PlaceInput toInput() {
        return new PlaceInput(name, excerpt, body, categoryId, geographyId, latitude, longitude, imageIds, seoTitle,
                metaDescription, canonicalUrl, ogImageUrl, youtubeUrl, robots);
    }
}
