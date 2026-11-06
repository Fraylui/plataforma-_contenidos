package pe.plataformacontenidos.media;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import pe.plataformacontenidos.media.api.ImagePublicController;

class ImagePublicControllerTest {

    private final ImageService imageService = mock(ImageService.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new ImagePublicController(imageService)).build();
    private final UUID id = UUID.randomUUID();
    private final Image image = mock(Image.class);

    @Test
    void conR2PublicoRedirigeYElBackendNoEnviaLosBytes() throws Exception {
        when(imageService.getOrThrow(id)).thenReturn(image);
        when(imageService.publicUrl(image)).thenReturn(Optional.of("https://media.ejemplo.pe/a.jpg"));

        mvc.perform(get("/api/v1/images/{id}/file", id))
                .andExpect(status().isMovedPermanently())
                .andExpect(header().string("Location", "https://media.ejemplo.pe/a.jpg"))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("max-age=31536000")));
    }

    @Test
    void sinDireccionPublicaSirveElArchivoComoAntes() throws Exception {
        when(imageService.getOrThrow(id)).thenReturn(image);
        when(image.getContentType()).thenReturn("image/png");
        when(imageService.publicUrl(image)).thenReturn(Optional.empty());
        when(imageService.loadFile(id)).thenReturn(new byte[] {9, 8});

        mvc.perform(get("/api/v1/images/{id}/file", id))
                .andExpect(status().isOk())
                .andExpect(content().bytes(new byte[] {9, 8}));
    }
}
