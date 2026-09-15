package pe.plataformacontenidos.places.api.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.places.PlaceInput;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideoInput;

public record PlaceRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 500) String excerpt,
        @NotBlank String body,
        @NotNull UUID categoryId,
        @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @DecimalMin("-180") @DecimalMax("180") Double longitude,
        List<ContentImageInput> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentVideoInput> videos,
        String robots) {

    public PlaceInput toInput() {
        return new PlaceInput(name, excerpt, body, categoryId, latitude, longitude,
                images == null ? List.of() : images, seoTitle, metaDescription, canonicalUrl, ogImageUrl,
                videos == null ? List.of() : videos, robots);
    }
}
