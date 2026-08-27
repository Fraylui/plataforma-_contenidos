package pe.plataformacontenidos.galleries.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.galleries.GalleryInput;

public record GalleryRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 500) String excerpt,
        @NotNull UUID categoryId,
        UUID geographyId,
        List<UUID> imageIds,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        String robots) {

    public GalleryInput toInput() {
        return new GalleryInput(title, excerpt, categoryId, geographyId, imageIds, seoTitle, metaDescription,
                canonicalUrl, ogImageUrl, robots);
    }
}
