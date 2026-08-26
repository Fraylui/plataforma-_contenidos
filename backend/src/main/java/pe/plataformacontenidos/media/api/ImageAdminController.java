package pe.plataformacontenidos.media.api;

import jakarta.validation.Valid;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.media.InvalidImageException;
import pe.plataformacontenidos.media.api.dto.ImageResponse;
import pe.plataformacontenidos.media.api.dto.UpdateAltTextRequest;
import pe.plataformacontenidos.identity.security.UserPrincipal;

@RestController
@RequestMapping("/api/v1/admin/images")
public class ImageAdminController {

    private final ImageService imageService;

    public ImageAdminController(ImageService imageService) {
        this.imageService = imageService;
    }

    @GetMapping
    public List<ImageResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return imageService.listForAdmin(principal.userId(), principal.role()).stream()
                .map(ImageResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ImageResponse upload(@RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String altText,
            @AuthenticationPrincipal UserPrincipal principal) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        if (bytes.length == 0) {
            throw new InvalidImageException("El archivo está vacío");
        }
        var image = imageService.upload(bytes, file.getOriginalFilename(), altText, principal.userId());
        return ImageResponse.from(image);
    }

    @PutMapping("/{id}")
    public ImageResponse updateAltText(@PathVariable UUID id, @Valid @RequestBody UpdateAltTextRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        var image = imageService.updateAltText(id, request.altText(), principal.userId(), principal.role());
        return ImageResponse.from(image);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        imageService.delete(id, principal.userId(), principal.role());
    }
}
