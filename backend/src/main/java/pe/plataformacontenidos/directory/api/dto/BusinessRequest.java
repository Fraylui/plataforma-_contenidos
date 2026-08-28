package pe.plataformacontenidos.directory.api.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.directory.BusinessInput;
import pe.plataformacontenidos.directory.BusinessType;

public record BusinessRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 500) String excerpt,
        @NotBlank String body,
        @NotNull UUID categoryId,
        UUID geographyId,
        @NotNull BusinessType businessType,
        UUID placeId,
        @Size(max = 300) String address,
        @Size(max = 50) String phone,
        @Email String email,
        String website,
        @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @DecimalMin("-180") @DecimalMax("180") Double longitude,
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String youtubeUrl,
        String robots) {

    public BusinessInput toInput() {
        return new BusinessInput(name, excerpt, body, categoryId, geographyId, businessType, placeId, address,
                phone, email, website, latitude, longitude, imageIds, seoTitle, metaDescription, canonicalUrl,
                ogImageUrl, youtubeUrl, robots);
    }
}
