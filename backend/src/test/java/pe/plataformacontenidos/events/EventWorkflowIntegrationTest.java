package pe.plataformacontenidos.events;

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

/** Eventos, con el mismo flujo editorial que Article/Places (sección 12). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class EventWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void fullEditorialLifecycleFromDraftToPublished() throws Exception {
        String editorToken = createUserAndLogin("events-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("events-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Eventos Culturales Test");

        String eventId = createDraftEvent(authorToken, categoryId, "Festival de la Wamanripa", "2030-06-14T19:00:00Z");

        // No visible públicamente en DRAFT
        mockMvc.perform(get("/api/v1/events/festival-de-la-wamanripa")).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));

        // El autor no puede aprobar su propio evento
        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/approve")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/v1/events/festival-de-la-wamanripa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Festival de la Wamanripa"))
                .andExpect(jsonPath("$.startsAt").exists());

        mockMvc.perform(get("/api/v1/events").param("categoryId", categoryId).param("when", "upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'festival-de-la-wamanripa')]").exists());

        mockMvc.perform(get("/api/v1/events").param("categoryId", categoryId).param("when", "past"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'festival-de-la-wamanripa')]").doesNotExist());

        // Archivar lo retira de la vista pública
        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/archive")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/v1/events/festival-de-la-wamanripa")).andExpect(status().isNotFound());
    }

    @Test
    void separatesUpcomingFromPastEvents() throws Exception {
        String editorToken = createUserAndLogin("events-editor-2@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("events-author-2@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Categoría Próximos Pasados Test");

        publishEvent(authorToken, editorToken, categoryId, "Feria Kimsapampa Próxima", "2031-03-01T10:00:00Z");
        publishEvent(authorToken, editorToken, categoryId, "Feria Kimsapampa Pasada", "2000-03-01T10:00:00Z");

        mockMvc.perform(get("/api/v1/events").param("categoryId", categoryId).param("when", "upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'feria-kimsapampa-proxima')]").exists())
                .andExpect(jsonPath("$.items[?(@.slug == 'feria-kimsapampa-pasada')]").doesNotExist());

        mockMvc.perform(get("/api/v1/events").param("categoryId", categoryId).param("when", "past"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'feria-kimsapampa-pasada')]").exists())
                .andExpect(jsonPath("$.items[?(@.slug == 'feria-kimsapampa-proxima')]").doesNotExist());

        mockMvc.perform(get("/api/v1/events/feria-kimsapampa-proxima")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/events/feria-kimsapampa-pasada")).andExpect(status().isOk());
    }

    @Test
    void rejectsEndsAtBeforeStartsAt() throws Exception {
        String authorToken = createUserAndLogin("events-author-3@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("events-editor-3@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Fechas Test");

        mockMvc.perform(post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Evento con fechas invertidas\",\"body\":\"Descripción.\","
                                + "\"categoryId\":\"" + categoryId + "\","
                                + "\"startsAt\":\"2030-06-14T19:00:00Z\",\"endsAt\":\"2030-06-14T10:00:00Z\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsUnknownPlaceId() throws Exception {
        String authorToken = createUserAndLogin("events-author-4@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("events-editor-4@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Lugar Inexistente Test");

        mockMvc.perform(post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Evento en lugar inexistente\",\"body\":\"Descripción.\","
                                + "\"categoryId\":\"" + categoryId + "\","
                                + "\"placeId\":\"00000000-0000-0000-0000-000000000000\","
                                + "\"startsAt\":\"2030-06-14T19:00:00Z\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void authorCannotEditSomeoneElsesEvent() throws Exception {
        String editorToken = createUserAndLogin("events-editor-5@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("events-author-5@plataforma-contenidos.test", Role.AUTHOR);
        String otherAuthorToken = createUserAndLogin("events-author-6@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Categoría Evento Ajeno Test");

        String eventId = createDraftEvent(authorToken, categoryId, "Concierto privado", "2030-06-14T19:00:00Z");

        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/submit")
                        .header("Authorization", "Bearer " + otherAuthorToken))
                .andExpect(status().isForbidden());
    }

    private String publishEvent(String authorToken, String editorToken, String categoryId, String title,
            String startsAt) throws Exception {
        String eventId = createDraftEvent(authorToken, categoryId, title, startsAt);
        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        return eventId;
    }

    private String createDraftEvent(String authorToken, String categoryId, String title, String startsAt)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Descripción completa del evento, con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"" + startsAt + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();
        return textField(result, "id");
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
