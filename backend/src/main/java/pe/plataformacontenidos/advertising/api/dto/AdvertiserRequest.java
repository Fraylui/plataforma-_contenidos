package pe.plataformacontenidos.advertising.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record AdvertiserRequest(@NotBlank String name, @Email String contactEmail, String contactPhone, UUID logoImageId) {
}
