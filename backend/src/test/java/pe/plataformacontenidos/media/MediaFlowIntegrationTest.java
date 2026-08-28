package pe.plataformacontenidos.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class MediaFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void authorUploadsValidPngAndItIsPubliclyServable() throws Exception {
        String authorToken = createUserAndLogin("media-author@plataforma-contenidos.test", Role.AUTHOR);
        byte[] png = generatePng(40, 30);

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/admin/images")
                        .file(new MockMultipartFile("file", "foto.png", "image/png", png))
                        .param("altText", "Plaza principal de Quinua")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.width").value(40))
                .andExpect(jsonPath("$.height").value(30))
                .andExpect(jsonPath("$.contentType").value("image/png"))
                .andExpect(jsonPath("$.altText").value("Plaza principal de Quinua"))
                .andReturn();

        JsonNode json = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String imageId = json.get("id").asText();

        MvcResult fileResult = mockMvc.perform(get("/api/v1/images/" + imageId + "/file"))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(fileResult.getResponse().getContentType()).isEqualTo("image/png");
        // Reencodeada: debe seguir siendo una imagen PNG válida y decodificable
        BufferedImage decoded = ImageIO.read(new java.io.ByteArrayInputStream(fileResult.getResponse().getContentAsByteArray()));
        assertThat(decoded.getWidth()).isEqualTo(40);
        assertThat(decoded.getHeight()).isEqualTo(30);
    }

    @Test
    void garbageBytesAreRejectedAsInvalidImage() throws Exception {
        String authorToken = createUserAndLogin("media-author-2@plataforma-contenidos.test", Role.AUTHOR);

        mockMvc.perform(multipart("/api/v1/admin/images")
                        .file(new MockMultipartFile("file", "no-es-imagen.png", "image/png",
                                "esto no es una imagen".getBytes()))
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void onlyOwnerOrEditorCanChangeAltTextOrDelete() throws Exception {
        String authorToken = createUserAndLogin("media-author-3@plataforma-contenidos.test", Role.AUTHOR);
        String otherAuthorToken = createUserAndLogin("media-author-4@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("media-editor@plataforma-contenidos.test", Role.EDITOR);

        String imageId = uploadPng(authorToken, 20, 20);

        mockMvc.perform(put("/api/v1/admin/images/" + imageId)
                        .header("Authorization", "Bearer " + otherAuthorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"altText\":\"intento ajeno\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/admin/images/" + imageId)
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"altText\":\"corregido por editor\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.altText").value("corregido por editor"));

        mockMvc.perform(delete("/api/v1/admin/images/" + imageId)
                        .header("Authorization", "Bearer " + otherAuthorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/admin/images/" + imageId)
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/images/" + imageId + "/file"))
                .andExpect(status().isNotFound());
    }

    private String uploadPng(String token, int width, int height) throws Exception {
        byte[] png = generatePng(width, height);
        MvcResult result = mockMvc.perform(multipart("/api/v1/admin/images")
                        .file(new MockMultipartFile("file", "foto.png", "image/png", png))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private byte[] generatePng(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setColor(java.awt.Color.BLUE);
        graphics.fillRect(0, 0, width, height);
        graphics.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private String createUserAndLogin(String email, Role role) throws Exception {
        String password = "SomeStrongPassword123!";
        userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role));

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
