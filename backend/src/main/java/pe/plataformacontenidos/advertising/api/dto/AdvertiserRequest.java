package pe.plataformacontenidos.advertising.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import pe.plataformacontenidos.advertising.AdvertiserIndustry;

/** {@code industry} ausente = GENERAL. */
public record AdvertiserRequest(@NotBlank String name, @Email String contactEmail, String contactPhone, UUID logoImageId,
        AdvertiserIndustry industry) {
}
