package pe.plataformacontenidos.celebrations.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import pe.plataformacontenidos.celebrations.CelebrationInput;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.shared.ContentVideoInput;

public record CelebrationRequest(
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
        String robots,
        /** Celebración que se repite cada año (28 de julio). Ausente = única. */
        Boolean recursYearly,
        /** Todo el día (sin hora). Ausente = con hora. */
        Boolean allDay,
        /** «Desde 1824», solo si se repite. */
        Integer sinceYear,
        /** Dónde se celebra: código de país ISO de 2 letras. Ausente = en todo el mundo. */
        @Size(max = 2) String scopeCountry,
        /** Región de ese país («Ayacucho»). Ausente = todo el país. */
        @Size(max = 100) String scopeRegion) {

    public CelebrationInput toInput() {
        return new CelebrationInput(title, excerpt, body, categoryId, placeId, venueName, startsAt, endsAt,
                images == null ? List.of() : images, seoTitle, metaDescription, canonicalUrl, ogImageUrl,
                videos == null ? List.of() : videos, robots, Boolean.TRUE.equals(recursYearly),
                Boolean.TRUE.equals(allDay), sinceYear, scopeCountry, scopeRegion);
    }
}
