package pe.plataformacontenidos.advertising.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdvertiserRequest(@NotBlank String name, @Email String contactEmail, String contactPhone) {
}
