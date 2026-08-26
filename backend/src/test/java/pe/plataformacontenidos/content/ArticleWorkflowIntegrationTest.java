package pe.plataformacontenidos.content;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
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
import tools.jackson.databind.JsonNode;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ArticleWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ScheduledPublishJob scheduledPublishJob;

    @Test
    void fullEditorialLifecycleFromDraftToPublishedToArchived() throws Exception {
        String editorToken = createUserAndLogin("wf-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("wf-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Actualidad");

        String articleId = createDraftArticle(authorToken, categoryId, "Un título de prueba para el artículo");

        // No visible públicamente en DRAFT
        mockMvc.perform(get("/api/v1/articles/un-titulo-de-prueba-para-el-articulo"))
                .andExpect(status().isNotFound());

        // El autor lo envía a revisión
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));

        // El autor no puede aprobar su propio artículo
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/approve")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isForbidden());

        // El editor aprueba y publica
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        // Ahora es visible públicamente
        mockMvc.perform(get("/api/v1/articles/un-titulo-de-prueba-para-el-articulo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Un título de prueba para el artículo"));

        mockMvc.perform(get("/api/v1/articles").param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'un-titulo-de-prueba-para-el-articulo')]").exists());

        // Archivar lo retira de la vista pública
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/archive")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/v1/articles/un-titulo-de-prueba-para-el-articulo"))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectionFlowAllowsAuthorToReviseAndResubmit() throws Exception {
        String editorToken = createUserAndLogin("wf-editor-2@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("wf-author-2@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Historia");

        String articleId = createDraftArticle(authorToken, categoryId, "Artículo que será rechazado");

        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/reject")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Faltan fuentes\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Faltan fuentes"));

        // El autor puede volver a enviarlo tras revisar
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));
    }

    @Test
    void authorCannotEditSomeoneElsesArticle() throws Exception {
        String editorToken = createUserAndLogin("wf-editor-3@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("wf-author-3@plataforma-contenidos.test", Role.AUTHOR);
        String otherAuthorToken = createUserAndLogin("wf-author-4@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Gastronomía");

        String articleId = createDraftArticle(authorToken, categoryId, "Receta ancestral de la región");

        mockMvc.perform(put("/api/v1/admin/articles/" + articleId)
                        .header("Authorization", "Bearer " + otherAuthorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(categoryId, "Intento de secuestro editorial")))
                .andExpect(status().isForbidden());
    }

    @Test
    void scheduledArticleIsPublishedOnceDueDateArrivesAndJobRuns() throws Exception {
        String editorToken = createUserAndLogin("wf-editor-5@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("wf-author-5@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Eventos");

        String articleId = createDraftArticle(authorToken, categoryId, "Feria programada para el fin de semana");

        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());

        Instant scheduledAt = Instant.now().plusSeconds(2);
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/schedule")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scheduledAt\":\"" + scheduledAt + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SCHEDULED"));

        mockMvc.perform(get("/api/v1/articles/feria-programada-para-el-fin-de-semana"))
                .andExpect(status().isNotFound());

        Thread.sleep(2500);
        scheduledPublishJob.publishDueArticles();

        mockMvc.perform(get("/api/v1/articles/feria-programada-para-el-fin-de-semana"))
                .andExpect(status().isOk());
    }

    @Test
    void articleLinksToGeographyAndIsFilterableBySlash() throws Exception {
        String editorToken = createUserAndLogin("wf-editor-6@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("wf-author-6@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Turismo Geografía Test");
        String peruId = createGeographyUnit(editorToken, "Perú Test", "PAIS", null);
        String ayacuchoId = createGeographyUnit(editorToken, "Ayacucho Test", "REGION", peruId);

        // geographyId inexistente: rechazado al crear
        mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJsonWithGeography(categoryId,
                                "00000000-0000-0000-0000-000000000000", "Artículo con ubicación inválida")))
                .andExpect(status().isNotFound());

        MvcResult createResult = mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJsonWithGeography(categoryId, ayacuchoId, "Turismo en la región andina")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.geographyId").value(ayacuchoId))
                .andReturn();
        String articleId = textField(createResult, "id");

        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/articles").param("geographyId", ayacuchoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'turismo-en-la-region-andina')]").exists());

        String otroPaisId = createGeographyUnit(editorToken, "Otro País Test", "PAIS", null);
        mockMvc.perform(get("/api/v1/articles").param("geographyId", otroPaisId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    private String createGeographyUnit(String editorToken, String name, String level, String parentId) throws Exception {
        String parentField = parentId == null ? "" : ",\"parentId\":\"" + parentId + "\"";
        MvcResult result = mockMvc.perform(post("/api/v1/admin/geography")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"level\":\"" + level + "\"" + parentField + "}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String articleJsonWithGeography(String categoryId, String geographyId, String title) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"excerpt\":\"Resumen breve\","
                + "\"body\":\"Cuerpo completo del artículo con suficiente contenido.\","
                + "\"articleType\":\"ARTICULO\","
                + "\"categoryId\":\"" + categoryId + "\","
                + "\"geographyId\":\"" + geographyId + "\","
                + "\"tagNames\":[\"ayacucho\",\"turismo\"]"
                + "}";
    }

    private String createDraftArticle(String authorToken, String categoryId, String title) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(categoryId, title)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();
        return textField(result, "id");
    }

    private String articleJson(String categoryId, String title) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"excerpt\":\"Resumen breve\","
                + "\"body\":\"Cuerpo completo del artículo con suficiente contenido.\","
                + "\"articleType\":\"ARTICULO\","
                + "\"categoryId\":\"" + categoryId + "\","
                + "\"tagNames\":[\"ayacucho\",\"cultura\"]"
                + "}";
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
