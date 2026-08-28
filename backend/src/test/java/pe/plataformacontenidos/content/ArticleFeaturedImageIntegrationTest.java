package pe.plataformacontenidos.content;

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

/** Foto destacada de artículos (sección 43) — mismo patrón de validación que Place.imageIds. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ArticleFeaturedImageIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void rejectsUnknownFeaturedImageId() throws Exception {
        String authorToken = createUserAndLogin("featured-author-1@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("featured-editor-1@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Imagen Destacada Test");

        mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Artículo con imagen destacada inexistente\","
                                + "\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo completo del artículo con suficiente contenido.\","
                                + "\"articleType\":\"ARTICULO\","
                                + "\"categoryId\":\"" + categoryId + "\","
                                + "\"featuredImageId\":\"00000000-0000-0000-0000-000000000000\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void acceptsRealUploadedImageAsFeaturedImageAndReturnsItInResponse() throws Exception {
        String authorToken = createUserAndLogin("featured-author-2@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("featured-editor-2@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Imagen Destacada Real Test");

        byte[] png = generatePng(40, 30);
        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/admin/images")
                        .file(new MockMultipartFile("file", "foto.png", "image/png", png))
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isCreated())
                .andReturn();
        String imageId = objectMapper.readTree(uploadResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Artículo con foto destacada real\","
                                + "\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo completo del artículo con suficiente contenido.\","
                                + "\"articleType\":\"ARTICULO\","
                                + "\"categoryId\":\"" + categoryId + "\","
                                + "\"featuredImageId\":\"" + imageId + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.featuredImageId").value(imageId))
                .andReturn();
        String articleId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());

        // Expuesta también en el listado público resumido, usado por las tarjetas.
        mockMvc.perform(get("/api/v1/articles").param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].featuredImageId").value(imageId));
    }

    private byte[] generatePng(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
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
        userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role));

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return textField(result, "accessToken");
    }
}
