package pe.plataformacontenidos.media.api;

import java.time.Duration;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.media.Image;
import pe.plataformacontenidos.media.ImageService;

/**
 * Sirve el binario. Público y sin autenticación a propósito: un <img src>
 * en el navegador no puede mandar un Authorization header. La opacidad del
 * nombre (UUID) es la única protección contra enumeración — aceptable para
 * el MVP porque las imágenes no son datos sensibles por sí mismas.
 */
@RestController
@RequestMapping("/api/v1/images")
public class ImagePublicController {

    private final ImageService imageService;

    public ImagePublicController(ImageService imageService) {
        this.imageService = imageService;
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> getFile(@PathVariable UUID id) {
        Image image = imageService.getOrThrow(id);
        byte[] content = imageService.loadFile(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .body(content);
    }
}
