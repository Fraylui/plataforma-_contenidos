package pe.plataformacontenidos.shared.publishing.api;

import jakarta.validation.constraints.Size;

/** Cuerpo opcional de POST /{tipo}/{id}/return-to-draft: una nota para quien lo creó. */
public record ReturnToDraftRequest(@Size(max = 1000) String note) {
}
