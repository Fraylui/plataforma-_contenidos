package pe.plataformacontenidos.stats;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

/** CONTEXTO.md sección 34: estadísticas básicas del panel admin. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class StatsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void reflectsCreatedCategoryAndArticleCounts() throws Exception {
        String editorToken = createUserAndLogin("stats-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("stats-author@plataforma-contenidos.test", Role.AUTHOR);

        MvcResult categoryResult = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Categoría Stats Test\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String categoryId = textField(categoryResult, "id");

        mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Artículo para estadísticas\",\"excerpt\":\"Resumen\","
                                + "\"body\":\"Cuerpo suficientemente largo.\",\"articleType\":\"ARTICULO\","
                                + "\"categoryId\":\"" + categoryId + "\",\"tagNames\":[]}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/admin/stats").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.articlesByStatus.DRAFT").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalCategories").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.usersByRole.EDITOR").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.usersByRole.AUTHOR").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void authorCannotAccessStats() throws Exception {
        String authorToken = createUserAndLogin("stats-author-2@plataforma-contenidos.test", Role.AUTHOR);

        mockMvc.perform(get("/api/v1/admin/stats").header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedCannotAccessStats() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")).andExpect(status().isForbidden());
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
