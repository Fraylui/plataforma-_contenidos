package pe.plataformacontenidos.live;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import pe.plataformacontenidos.identity.permission.TestProfile;
import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import tools.jackson.databind.ObjectMapper;

/**
 * En vivo sin clave de YouTube: el equipo programa, marca "en vivo" y
 * termina; el sitio sabe qué mostrar en "En vivo ahora".
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class LiveIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkerPermissionRepository workerPermissions;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private LiveStreamService liveStreamService;

    /** La base de pruebas es compartida: nada queda "en vivo" para la siguiente prueba. */
    @AfterEach
    void endEverything() {
        jdbc.update("UPDATE live.streams SET status = 'ENDED', ended_at = now() WHERE status = 'LIVE'");
    }

    @Test
    void scheduleGoLiveAndEnd() throws Exception {
        String token = login(TestProfile.SOLO_CONTENIDO);
        String id = create(token, "https://www.youtube.com/live/dQw4w9WgXcQ", "Recorrido en vivo por Kuélap");

        mockMvc.perform(get("/api/v1/live/upcoming"))
                .andExpect(jsonPath("$[?(@.id == '" + id + "')].status").value("SCHEDULED"));

        mockMvc.perform(post("/api/v1/admin/live/" + id + "/start").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LIVE"));
        mockMvc.perform(get("/api/v1/live/now"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.youtubeVideoId").value("dQw4w9WgXcQ"));

        // Solo una en vivo a la vez
        String second = create(token, "https://youtu.be/aBcDeFgHiJk", "Otra transmisión");
        mockMvc.perform(post("/api/v1/admin/live/" + second + "/start").header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/v1/admin/live/" + id + "/end").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENDED"));
        mockMvc.perform(get("/api/v1/live/now")).andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/admin/live/" + id + "/end").header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsNonYouTubeLinksAndHidesCancelled() throws Exception {
        String token = login(TestProfile.SOLO_CONTENIDO);
        mockMvc.perform(post("/api/v1/admin/live").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("https://vimeo.com/123", "Mal link", category())))
                .andExpect(status().isBadRequest());

        String id = create(token, "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "Se cancela");
        String slug = objectMapper.readTree(mockMvc.perform(get("/api/v1/admin/live/" + id)
                .header("Authorization", "Bearer " + token)).andReturn().getResponse().getContentAsString()).get("slug").asText();
        mockMvc.perform(post("/api/v1/admin/live/" + id + "/cancel").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/live/" + slug)).andExpect(status().isNotFound());
    }

    @Test
    void forgottenStreamsEndAfterTwelveHours() throws Exception {
        String token = login(TestProfile.SOLO_CONTENIDO);
        String id = create(token, "https://youtu.be/dQw4w9WgXcQ", "Me olvidé de terminar");
        mockMvc.perform(post("/api/v1/admin/live/" + id + "/start").header("Authorization", "Bearer " + token));
        jdbc.update("UPDATE live.streams SET started_at = ? WHERE id = ?::uuid",
                java.sql.Timestamp.from(Instant.now().minus(LiveStreamService.MAX_LIVE).minusSeconds(60)), id);

        assertThat(liveStreamService.endForgotten()).isGreaterThanOrEqualTo(1);
        mockMvc.perform(get("/api/v1/live/now")).andExpect(status().isNoContent());
    }

    @Test
    void withoutTheSeriesModuleThePanelIsClosed() throws Exception {
        mockMvc.perform(get("/api/v1/admin/live").header("Authorization", "Bearer " + login(TestProfile.SIN_PERMISOS)))
                .andExpect(status().isForbidden());
    }

    private String create(String token, String url, String title) throws Exception {
        String response = mockMvc.perform(post("/api/v1/admin/live").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(url, title, category())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }

    private static String body(String url, String title, String categoryId) {
        return "{\"videoUrl\":\"" + url + "\",\"title\":\"" + title + "\",\"categoryId\":\"" + categoryId + "\"}";
    }

    private String categoryId;

    private String category() throws Exception {
        if (categoryId == null) {
            String owner = login(TestProfile.DUENO);
            String response = mockMvc.perform(post("/api/v1/admin/categories").header("Authorization", "Bearer " + owner)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"En vivo " + UUID.randomUUID().toString().substring(0, 8) + "\"}"))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            categoryId = objectMapper.readTree(response).get("id").asText();
        }
        return categoryId;
    }

    private String login(TestProfile profile) throws Exception {
        String email = "live-" + UUID.randomUUID() + "@plataforma-contenidos.test";
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", profile.toRole()));
        profile.grant(workerPermissions, created.getId());
        String response = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }
}
