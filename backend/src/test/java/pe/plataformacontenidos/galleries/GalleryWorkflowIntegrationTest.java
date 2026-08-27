package pe.plataformacontenidos.galleries;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Galerías, con el mismo flujo editorial que Article/Places/Events (sección 12), sin cuerpo de texto largo. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class GalleryWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void fullEditorialLifecycleFromDraftToPublished() throws Exception {
        String editorToken = createUserAndLogin("galleries-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("galleries-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Galerías Culturales Test");
        String imageId = uploadImage(authorToken);

        String galleryId = createDraftGallery(authorToken, categoryId, "Fiesta Patronal de Quinua", imageId);

        // No visible públicamente en DRAFT
        mockMvc.perform(get("/api/v1/galleries/fiesta-patronal-de-quinua")).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/galleries/" + galleryId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));

        // El autor no puede aprobar su propia galería
        mockMvc.perform(post("/api/v1/admin/galleries/" + galleryId + "/approve")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/admin/galleries/" + galleryId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(post("/api/v1/admin/galleries/" + galleryId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/v1/galleries/fiesta-patronal-de-quinua"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Fiesta Patronal de Quinua"))
                .andExpect(jsonPath("$.imageIds[0]").value(imageId));

        mockMvc.perform(get("/api/v1/galleries").param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'fiesta-patronal-de-quinua')]").exists());

        // Archivar lo retira de la vista pública
        mockMvc.perform(post("/api/v1/admin/galleries/" + galleryId + "/archive")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/v1/galleries/fiesta-patronal-de-quinua")).andExpect(status().isNotFound());
    }

    @Test
    void rejectsGalleryWithoutAnyImage() throws Exception {
        String authorToken = createUserAndLogin("galleries-author-2@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("galleries-editor-2@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Sin Fotos Test");

        mockMvc.perform(post("/api/v1/admin/galleries")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Galeria vacia\",\"categoryId\":\"" + categoryId + "\",\"imageIds\":[]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsUnknownImageIdInGallery() throws Exception {
        String authorToken = createUserAndLogin("galleries-author-3@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("galleries-editor-3@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Imagen Inexistente Test");

        mockMvc.perform(post("/api/v1/admin/galleries")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Galeria con imagen inexistente\",\"categoryId\":\"" + categoryId + "\","
                                + "\"imageIds\":[\"00000000-0000-0000-0000-000000000000\"]}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void authorCannotEditSomeoneElsesGallery() throws Exception {
        String editorToken = createUserAndLogin("galleries-editor-4@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("galleries-author-4@plataforma-contenidos.test", Role.AUTHOR);
        String otherAuthorToken = createUserAndLogin("galleries-author-5@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Categoría Galería Ajena Test");
        String imageId = uploadImage(authorToken);

        String galleryId = createDraftGallery(authorToken, categoryId, "Coleccion privada", imageId);

        mockMvc.perform(post("/api/v1/admin/galleries/" + galleryId + "/submit")
                        .header("Authorization", "Bearer " + otherAuthorToken))
                .andExpect(status().isForbidden());
    }

    private String uploadImage(String authorToken) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "gallery-test.png", "image/png", generatePng(40, 30));
        MvcResult result = mockMvc.perform(multipart("/api/v1/admin/images").file(file)
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private byte[] generatePng(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private String createDraftGallery(String authorToken, String categoryId, String title, String imageId)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/galleries")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"categoryId\":\"" + categoryId + "\",\"imageIds\":[\"" + imageId + "\"]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();
        return textField(result, "id");
    }

    private String createCategory(String editorToken, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String textField(MvcResult result, String field) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get(field).asText();
    }

    private String createUserAndLogin(String email, Role role) throws Exception {
        String password = "SomeStrongPassword123!";
        userRepository.save(new User(email, passwordEncoder.encode(password), "Test User", role));

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return textField(result, "accessToken");
    }
}
