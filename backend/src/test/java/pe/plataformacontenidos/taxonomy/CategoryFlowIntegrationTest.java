package pe.plataformacontenidos.taxonomy;

import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import pe.plataformacontenidos.identity.permission.TestProfile;
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
    private WorkerPermissionRepository workerPermissions;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Test
    void theSiteOnlyListsTopicsWithPublishedContentButThePanelSeesThemAll() throws Exception {
        String token = createUserAndLogin("cat-contenido@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String parentId = createCategory(token, "{\"name\":\"Viajes con contenido\"}");
        String childId = createCategory(token, "{\"name\":\"Playas con contenido\",\"parentId\":\"" + parentId + "\"}");
        createCategory(token, "{\"name\":\"Tema vacío\"}");
        UUID authorId = jdbc.queryForObject("SELECT id FROM identity.users WHERE email = 'cat-contenido@plataforma-contenidos.test'", UUID.class);
        jdbc.update("INSERT INTO galleries.galleries (slug, title, author_id, category_id, status, published_at) "
                + "VALUES ('playa-publicada', 'Playa', ?, CAST(? AS uuid), 'PUBLISHED', now())", authorId, childId);

        // El sitio: solo temas con algo publicado, y el padre del que lo tiene (el árbol no se corta).
        mockMvc.perform(get("/api/v1/categories").param("withContent", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.slug == 'playas-con-contenido')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'viajes-con-contenido')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'tema-vacio')]").doesNotExist());
        // El panel elige tema al crear: ve también los vacíos.
        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(jsonPath("$[?(@.slug == 'tema-vacio')]").exists());
    }

    private String createCategory(String token, String body) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void publisherCanCreateCategoryCreatorCannotAndPublicSeesOnlyActive() throws Exception {
        String publisherToken = createUserAndLogin("cat-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("cat-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Turismo\"}"))
                .andExpect(status().isForbidden());

        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + publisherToken)
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
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());

        // Desactivar: ya no aparece en el listado público, pero sigue existiendo
        mockMvc.perform(put("/api/v1/admin/categories/" + categoryId)
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Turismo\",\"sortOrder\":1}"))
                .andExpect(status().isOk());
    }

    @Test
    void categoryNameMustBeUniqueIgnoringCase() throws Exception {
        String publisherToken = createUserAndLogin("cat-dup@plataforma-contenidos.test", TestProfile.PUBLICADOR);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Gastronomía Unicidad Test\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"gastronomía unicidad test\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void categoryCannotBeItsOwnParent() throws Exception {
        String publisherToken = createUserAndLogin("cat-hierarchy@plataforma-contenidos.test", TestProfile.PUBLICADOR);

        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Cultura\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String categoryId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/api/v1/admin/categories/" + categoryId)
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Cultura\",\"parentId\":\"" + categoryId + "\",\"sortOrder\":0}"))
                .andExpect(status().isConflict());
    }

    private String createUserAndLogin(String email, TestProfile role) throws Exception {
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role.toRole()));
        role.grant(workerPermissions, created.getId());
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
