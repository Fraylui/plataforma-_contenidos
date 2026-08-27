package pe.plataformacontenidos.search;

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

/**
 * CONTEXTO.md sección 16: búsqueda de texto completo, unificada sobre
 * Artículos (V12__article_search.sql) y Lugares (V15__place_search.sql) —
 * antes solo cubría Artículos.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class SearchIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void findsPublishedArticleByTitleWordAndNotUnrelatedMatches() throws Exception {
        String editorToken = createUserAndLogin("search-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("search-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Turismo Búsqueda Test");

        // Palabra distintiva (no "turismo"/"andino" sueltos: la suite completa
        // comparte una sola base entre clases de test, y esas son demasiado
        // comunes en otros fixtures — daría falsos positivos de tamaño exacto).
        publishArticle(authorToken, editorToken, categoryId,
                "Quinua, Ayacucho: historia y kimsapampatur andino",
                "Un recorrido por la plaza y la iglesia colonial de Quinua.");
        publishArticle(authorToken, editorToken, categoryId,
                "Receta tradicional de puca picante",
                "Un plato típico ayacuchano, sin relación con lo anterior.");

        mockMvc.perform(get("/api/v1/search").param("q", "kimsapampatur"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.items[0].title").value("Quinua, Ayacucho: historia y kimsapampatur andino"))
                .andExpect(jsonPath("$.items[0].contentType").value("ARTICLE"));
    }

    @Test
    void findsPublishedPlace() throws Exception {
        String editorToken = createUserAndLogin("search-place-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("search-place-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Categoría Lugar Búsqueda Test");

        String placeId = createPlace(authorToken, categoryId, "Templo colonial de Huamanguilla");
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/search").param("q", "Huamanguilla"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].title").value("Templo colonial de Huamanguilla"))
                .andExpect(jsonPath("$.items[0].contentType").value("PLACE"));
    }

    @Test
    void doesNotReturnDraftArticles() throws Exception {
        String authorToken = createUserAndLogin("search-author-2@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("search-editor-2@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Draft Test");

        mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(categoryId, "Borrador exclusivo sobre criptomonedas")))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/search").param("q", "criptomonedas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void blankQueryReturnsEmptyPageInsteadOfError() throws Exception {
        mockMvc.perform(get("/api/v1/search").param("q", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    private void publishArticle(String authorToken, String editorToken, String categoryId, String title,
            String body) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJsonWithBody(categoryId, title, body)))
                .andExpect(status().isCreated())
                .andReturn();
        String articleId = textField(result, "id");

        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
    }

    private String createPlace(String authorToken, String categoryId, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Historia del lugar con suficiente contenido para el índice.\","
                                + "\"categoryId\":\"" + categoryId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String articleJsonWithBody(String categoryId, String title, String body) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"excerpt\":\"Resumen breve\","
                + "\"body\":\"" + body + "\","
                + "\"articleType\":\"ARTICULO\","
                + "\"categoryId\":\"" + categoryId + "\","
                + "\"tagNames\":[]"
                + "}";
    }

    private String articleJson(String categoryId, String title) {
        return articleJsonWithBody(categoryId, title, "Cuerpo completo del artículo con suficiente contenido.");
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
