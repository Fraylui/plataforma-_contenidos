package pe.plataformacontenidos.feed;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Feed unificado del home (Publicaciones + Lugares + Eventos) y contenido
 * relacionado de la vista de detalle — ver FeedService.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class FeedIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void feedMixesArticlesPlacesAndEvents() throws Exception {
        String editorToken = createUserAndLogin("feed-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("feed-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Mix");

        publishArticle(authorToken, editorToken, categoryId, "Feed: publicación de prueba " + UUID.randomUUID());
        publishPlace(authorToken, editorToken, categoryId, "Feed: lugar de prueba " + UUID.randomUUID());
        publishEvent(authorToken, editorToken, categoryId, "Feed: evento de prueba " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].type", hasItem("ARTICLE")))
                .andExpect(jsonPath("$.items[*].type", hasItem("PLACE")))
                .andExpect(jsonPath("$.items[*].type", hasItem("EVENT")));
    }

    @Test
    void feedExcludesIdsAlreadySeenByClient() throws Exception {
        String editorToken = createUserAndLogin("feed-exclude-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("feed-exclude-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Exclude");

        String articleId = publishArticle(authorToken, editorToken, categoryId,
                "Feed: publicación a excluir " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("exclude", articleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", not(hasItem(articleId))));
    }

    @Test
    void feedKeepsMostRecentExcludeIdsWhenListExceedsTheBoundedLimit() throws Exception {
        // Regresión: boundedExcludeSet debe conservar los últimos IDs vistos
        // (los más recientes), no los primeros — el cliente reenvía la lista
        // completa de "ya visto" en orden de aparición en cada scroll.
        String editorToken = createUserAndLogin("feed-exclude-bound-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("feed-exclude-bound-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Exclude Bound");

        String articleId = publishArticle(authorToken, editorToken, categoryId,
                "Feed: excluido al final de una lista larga " + UUID.randomUUID());

        String[] excludeParams = new String[301];
        for (int i = 0; i < 300; i++) {
            excludeParams[i] = UUID.randomUUID().toString();
        }
        excludeParams[300] = articleId; // el visto más recientemente, al final de la lista

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("exclude", excludeParams))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", not(hasItem(articleId))));
    }

    @Test
    void feedNeverReturnsUnpublishedContent() throws Exception {
        String authorToken = createUserAndLogin("feed-draft-author@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("feed-draft-editor@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Feed Draft");
        String draftTitle = "Feed: borrador que no debe salir " + UUID.randomUUID();

        mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(categoryId, draftTitle)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/feed").param("size", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].title", not(hasItem(draftTitle))));
    }

    @Test
    void malformedExcludeIdIsBadRequestNotServerError() throws Exception {
        mockMvc.perform(get("/api/v1/feed").param("exclude", "not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("Exception"))));
    }

    @Test
    void relatedReturnsItemsSharingCategoryAndExcludesSelf() throws Exception {
        String editorToken = createUserAndLogin("feed-related-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("feed-related-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Related");
        String otherCategoryId = createCategory(editorToken, "Feed Related Otra");

        String sourceArticleId = publishArticle(authorToken, editorToken, categoryId,
                "Feed: fuente para relacionados " + UUID.randomUUID());
        String relatedPlaceId = publishPlace(authorToken, editorToken, categoryId,
                "Feed: lugar relacionado " + UUID.randomUUID());
        publishPlace(authorToken, editorToken, otherCategoryId, "Feed: lugar sin relación " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed/related")
                        .param("excludeType", "ARTICLE")
                        .param("excludeId", sourceArticleId)
                        .param("categoryId", categoryId)
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(sourceArticleId))))
                .andExpect(jsonPath("$[*].id", hasItem(relatedPlaceId)))
                .andExpect(jsonPath("$[*].categoryId", everyItem(is(categoryId))));
    }

    @Test
    void relatedWithoutCategoryReturnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/v1/feed/related")
                        .param("excludeType", "ARTICLE")
                        .param("excludeId", UUID.randomUUID().toString())
                        .param("categoryId", UUID.randomUUID().toString()))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    private String publishArticle(String authorToken, String editorToken, String categoryId, String title)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(categoryId, title)))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/articles/" + id, authorToken, editorToken);
        return id;
    }

    private String publishPlace(String authorToken, String editorToken, String categoryId, String name)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/places/" + id, authorToken, editorToken);
        return id;
    }

    private String publishEvent(String authorToken, String editorToken, String categoryId, String title)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"2030-06-14T19:00:00Z\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/events/" + id, authorToken, editorToken);
        return id;
    }

    private void runWorkflow(String basePath, String authorToken, String editorToken) throws Exception {
        mockMvc.perform(post(basePath + "/submit").header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post(basePath + "/approve").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post(basePath + "/publish").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
    }

    private String articleJson(String categoryId, String title) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"excerpt\":\"Resumen breve\","
                + "\"body\":\"Cuerpo de prueba con suficiente contenido para publicar.\","
                + "\"articleType\":\"ARTICULO\","
                + "\"categoryId\":\"" + categoryId + "\","
                + "\"tagNames\":[]"
                + "}";
    }

    private String createCategory(String editorToken, String name) throws Exception {
        name = name + " " + UUID.randomUUID().toString().substring(0, 8);
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
