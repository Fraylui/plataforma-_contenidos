package pe.plataformacontenidos.media.api.dto;

import java.time.Instant;
import java.util.UUID;
import pe.plataformacontenidos.media.Image;
import pe.plataformacontenidos.media.ImagePurpose;

public record ImageResponse(
        UUID id,
        String originalFilename,
        String url,
        String contentType,
        long sizeBytes,
        int width,
        int height,
        String altText,
        ImagePurpose purpose,
        UUID uploadedBy,
        Instant createdAt) {

    public static ImageResponse from(Image image) {
        return new ImageResponse(image.getId(), image.getOriginalFilename(), "/api/v1/images/" + image.getId() + "/file",
                image.getContentType(), image.getSizeBytes(), image.getWidth(), image.getHeight(),
                image.getAltText(), image.getPurpose(), image.getUploadedBy(), image.getCreatedAt());
    }
}
