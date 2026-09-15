package pe.plataformacontenidos.events.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.events.EventInput;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideoInput;

public record EventRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 500) String excerpt,
        @NotBlank String body,
        @NotNull UUID categoryId,
        UUID placeId,
        @Size(max = 200) String venueName,
        @NotNull Instant startsAt,
        Instant endsAt,
        List<ContentImageInput> images,
        String seoTitle,
        String metaDescription,
        String canonicalUrl,
        String ogImageUrl,
        List<ContentVideoInput> videos,
        String robots) {

    public EventInput toInput() {
        return new EventInput(title, excerpt, body, categoryId, placeId, venueName, startsAt, endsAt,
                images == null ? List.of() : images, seoTitle, metaDescription, canonicalUrl, ogImageUrl,
                videos == null ? List.of() : videos, robots);
    }
}
