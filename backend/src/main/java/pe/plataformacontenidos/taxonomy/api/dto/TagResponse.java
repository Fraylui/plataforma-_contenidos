package pe.plataformacontenidos.taxonomy.api.dto;

import java.util.UUID;
import pe.plataformacontenidos.taxonomy.Tag;

public record TagResponse(UUID id, String name, String slug) {
    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getSlug());
    }
}
