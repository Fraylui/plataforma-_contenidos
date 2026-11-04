package pe.plataformacontenidos.feed;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
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

/** Regla: un tema sin contenido publicado no se muestra (CONTEXTO.md 43.5). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class CategoryPresenceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void soloListaTemasConContenidoPublicadoYSusPadres() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String authorToken = createUserAndLogin("cp-author-" + suffix + "@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("cp-editor-" + suffix + "@plataforma-contenidos.test", Role.EDITOR);
        String vacio = createCategory(editorToken, "Tema vacío", null);
        String borrador = createCategory(editorToken, "Tema solo borrador", null);
        String padre = createCategory(editorToken, "Tema padre", null);
        String hijo = createCategory(editorToken, "Subtema con contenido", padre);

        publish(authorToken, editorToken, hijo, "Contenido publicado " + suffix, "");
        // Un borrador no cuenta como contenido.
        mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson("Borrador " + suffix, borrador, "")))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/feed/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasItem(hijo)))
                .andExpect(jsonPath("$", hasItem(padre)))
                .andExpect(jsonPath("$", not(hasItem(vacio))))
                .andExpect(jsonPath("$", not(hasItem(borrador))));
    }

    private String publish(String authorToken, String editorToken, String categoryId, String title, String extra)
            throws Exception {
        String id = textField(mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(title, categoryId, extra)))
                .andExpect(status().isCreated())
                .andReturn(), "id");
        mockMvc.perform(post("/api/v1/admin/articles/" + id + "/submit").header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + id + "/approve").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + id + "/publish").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        return id;
    }

    private static String articleJson(String title, String categoryId, String extra) {
        return "{\"title\":\"" + title + "\","
                + "\"body\":\"Cuerpo completo del contenido con suficiente texto.\","
                + "\"articleType\":\"HISTORIA\","
                + "\"categoryId\":\"" + categoryId + "\"" + extra + "}";
    }

    private String createCategory(String editorToken, String name, String parentId) throws Exception {
        name = name + " " + UUID.randomUUID().toString().substring(0, 8);
        String parent = parentId == null ? "" : ",\"parentId\":\"" + parentId + "\"";
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"" + parent + "}"))
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
