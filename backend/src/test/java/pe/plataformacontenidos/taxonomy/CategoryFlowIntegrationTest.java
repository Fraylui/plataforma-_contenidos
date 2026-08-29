package pe.plataformacontenidos.taxonomy;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class CategoryFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void editorCanCreateCategoryAuthorCannotAndPublicSeesOnlyActive() throws Exception {
        String editorToken = createUserAndLogin("cat-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("cat-author@plataforma-contenidos.test", Role.AUTHOR);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Turismo\"}"))
                .andExpect(status().isForbidden());

        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Turismo\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("turismo"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn();
        String categoryId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.slug == 'turismo')]").exists());

        // Lectura pública por id (sin token) — el frontend la necesita para mostrar el nombre de la categoría de un artículo
        mockMvc.perform(get("/api/v1/categories/" + categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("turismo"));

        mockMvc.perform(get("/api/v1/categories/00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/categories/" + categoryId + "/activate")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());

        // Desactivar: ya no aparece en el listado público, pero sigue existiendo
        mockMvc.perform(put("/api/v1/admin/categories/" + categoryId)
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Turismo\",\"sortOrder\":1}"))
                .andExpect(status().isOk());
    }

    @Test
    void categoryNameMustBeUniqueIgnoringCase() throws Exception {
        String editorToken = createUserAndLogin("cat-dup@plataforma-contenidos.test", Role.EDITOR);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Gastronomía\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"gastronomía\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void categoryCannotBeItsOwnParent() throws Exception {
        String editorToken = createUserAndLogin("cat-hierarchy@plataforma-contenidos.test", Role.EDITOR);

        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Cultura\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String categoryId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/api/v1/admin/categories/" + categoryId)
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Cultura\",\"parentId\":\"" + categoryId + "\",\"sortOrder\":0}"))
                .andExpect(status().isConflict());
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
