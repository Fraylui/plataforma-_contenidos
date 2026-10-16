package pe.plataformacontenidos.content;

import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
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
import tools.jackson.databind.JsonNode;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class PublicationWorkflowIntegrationTest {

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
    private ScheduledPublishJob scheduledPublishJob;

    @Test
    void workerPublishesStraightFromDraftAndArchives() throws Exception {
        String publisherToken = createUserAndLogin("wf-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String workerToken = createUserAndLogin("wf-trabajador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Actualidad");

        String publicationId = createDraftPublication(workerToken, categoryId, "Un título de prueba para el artículo");

        // No visible públicamente en borrador
        mockMvc.perform(get("/api/v1/publications/un-titulo-de-prueba-para-el-articulo"))
                .andExpect(status().isNotFound());

        // Sin paso de aprobación: quien tiene el módulo publica directo
        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/publish")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/v1/publications/un-titulo-de-prueba-para-el-articulo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Un título de prueba para el artículo"));

        mockMvc.perform(get("/api/v1/publications").param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'un-titulo-de-prueba-para-el-articulo')]").exists());

        // Archivar lo retira de la vista pública
        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/archive")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/v1/publications/un-titulo-de-prueba-para-el-articulo"))
                .andExpect(status().isNotFound());
    }

    @Test
    void returnToDraftCancelsTheSchedule() throws Exception {
        String publisherToken = createUserAndLogin("wf-publicador-2@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(publisherToken, "Historia");
        String publicationId = createDraftPublication(publisherToken, categoryId, "Publicación que vuelve a borrador");

        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/return-to-draft")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/schedule")
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scheduledAt\":\"" + Instant.now().plusSeconds(3600) + "\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/return-to-draft")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.scheduledAt").doesNotExist());
    }

    @Test
    void publisherCanPublishStraightFromDraftButNotArchivedContent() throws Exception {
        String publisherToken = createUserAndLogin("wf-publicador-6@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(publisherToken, "Directo");

        String publicationId = createDraftPublication(publisherToken, categoryId, "Publicada directo desde borrador");
        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/archive")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No se puede publicar: está Archivado."));
    }

    @Test
    void teammatesWithTheModuleEditEachOthersContentButOthersCannot() throws Exception {
        String publisherToken = createUserAndLogin("wf-publicador-3@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String workerToken = createUserAndLogin("wf-trabajador-3@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String teammateToken = createUserAndLogin("wf-trabajador-4@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String outsiderToken = createUserAndLogin("wf-sin-permisos@plataforma-contenidos.test", TestProfile.SIN_PERMISOS);
        String categoryId = createCategory(publisherToken, "Gastronomía");

        String publicationId = createDraftPublication(workerToken, categoryId, "Receta ancestral de la región");

        mockMvc.perform(put("/api/v1/admin/publications/" + publicationId)
                        .header("Authorization", "Bearer " + teammateToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(publicationJson(categoryId, "Receta ancestral de la región, mejorada")))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/admin/publications/" + publicationId)
                        .header("Authorization", "Bearer " + outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(publicationJson(categoryId, "Sin el módulo no se edita")))
                .andExpect(status().isForbidden());
    }

    @Test
    void scheduledPublicationIsPublishedOnceDueDateArrivesAndJobRuns() throws Exception {
        String publisherToken = createUserAndLogin("wf-publicador-5@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String workerToken = createUserAndLogin("wf-trabajador-5@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Eventos");

        String publicationId = createDraftPublication(workerToken, categoryId, "Feria programada para el fin de semana");

        Instant scheduledAt = Instant.now().plusSeconds(2);
        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/schedule")
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scheduledAt\":\"" + scheduledAt + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SCHEDULED"));

        mockMvc.perform(get("/api/v1/publications/feria-programada-para-el-fin-de-semana"))
                .andExpect(status().isNotFound());

        Thread.sleep(2500);
        scheduledPublishJob.publishDuePublications();

        mockMvc.perform(get("/api/v1/publications/feria-programada-para-el-fin-de-semana"))
                .andExpect(status().isOk());
    }

    @Test
    void publicationStoresYoutubeVideoIdParsedFromUrlAndRejectsInvalidUrl() throws Exception {
        String publisherToken = createUserAndLogin("wf-publicador-7@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String workerToken = createUserAndLogin("wf-trabajador-7@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Entretenimiento Test");

        mockMvc.perform(post("/api/v1/admin/publications")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(publicationJsonWithYoutube(categoryId, "https://vimeo.com/12345678",
                                "Artículo con URL de video inválida")))
                .andExpect(status().isBadRequest());

        MvcResult result = mockMvc.perform(post("/api/v1/admin/publications")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(publicationJsonWithYoutube(categoryId,
                                "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s", "Artículo con video de YouTube")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.videos[0].videoId").value("dQw4w9WgXcQ"))
                .andReturn();

        String publicationId = textField(result, "id");
        mockMvc.perform(get("/api/v1/admin/publications/" + publicationId)
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.videos[0].videoId").value("dQw4w9WgXcQ"));
    }

    private String publicationJsonWithYoutube(String categoryId, String youtubeUrl, String title) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"excerpt\":\"Resumen breve\","
                + "\"body\":\"Cuerpo completo del artículo con suficiente contenido.\","
                + "\"publicationType\":\"GENERAL\","
                + "\"categoryId\":\"" + categoryId + "\","
                + "\"videos\":[{\"url\":\"" + youtubeUrl + "\"}]"
                + "}";
    }

    private String createDraftPublication(String workerToken, String categoryId, String title) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/publications")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(publicationJson(categoryId, title)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();
        return textField(result, "id");
    }

    private String publicationJson(String categoryId, String title) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"excerpt\":\"Resumen breve\","
                + "\"body\":\"Cuerpo completo del artículo con suficiente contenido.\","
                + "\"publicationType\":\"GENERAL\","
                + "\"categoryId\":\"" + categoryId + "\""
                + "}";
    }

    private String createCategory(String publisherToken, String name) throws Exception {
        // Sufijo único: la BD de Testcontainers se comparte entre clases de test y el nombre de categoría es único (ignore-case).
        name = name + " " + UUID.randomUUID().toString().substring(0, 8);
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + publisherToken)
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

    private String createUserAndLogin(String email, TestProfile role) throws Exception {
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role.toRole()));
        role.grant(workerPermissions, created.getId());
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return textField(result, "accessToken");
    }
}
