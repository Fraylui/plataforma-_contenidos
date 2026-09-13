package pe.plataformacontenidos.events.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.events.EventInput;
import pe.plataformacontenidos.shared.ContentImageInput;

public record EventRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 500) String excerpt,
        @NotBlank String body,
        @NotNull UUID categoryId,
        UUID geographyId,
        UUID placeId,
        @Size(max = 200) String venueName,
        @NotNull Instant startsAt,
        Instant endsAt,
        List<ContentImageInput> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<String> youtubeUrls,
        String robots) {

    public EventInput toInput() {
        return new EventInput(title, excerpt, body, categoryId, geographyId, placeId, venueName, startsAt, endsAt,
                images == null ? List.of() : images, seoTitle, metaDescription, canonicalUrl, ogImageUrl,
                youtubeUrls == null ? List.of() : youtubeUrls, robots);
    }
}
