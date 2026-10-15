package pe.plataformacontenidos.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;
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
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.LegacyRole;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.Permissions;
import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import tools.jackson.databind.ObjectMapper;

/** Inicio del panel en una llamada (hoja de ruta F3): cifras reales y solo lo que el usuario puede ver. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class DashboardIntegrationTest {

    private static final LocalDate TODAY = LocalDate.now(ZoneId.of("America/Lima"));

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private JdbcTemplate jdbc;

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

    @Test
    void creatorSeesOnlyOwnContentWithRealTotalsAndPreviousPeriod() {
        UUID worker = UUID.randomUUID();
        UUID published = gallery(worker, "PUBLISHED");
        gallery(worker, "IN_REVIEW");
        UUID someoneElses = gallery(UUID.randomUUID(), "PUBLISHED");
        views(published, TODAY, 5);
        views(published, TODAY.minusDays(10), 3);
        views(someoneElses, TODAY, 9);
        jdbc.update("INSERT INTO engagement.content_likes (content_type, content_id, visitor_id) VALUES ('GALLERY', ?, ?)",
                published, UUID.randomUUID());

        DashboardSummary summary = dashboardService.summary(
                new Permissions(worker, false, true, false, Map.of(Module.GALLERIES, AccessLevel.CREATE)), 7);

        assertThat(summary.series()).hasSize(7);
        assertThat(summary.views().current()).isEqualTo(5);
        assertThat(summary.views().previous()).isEqualTo(3);
        assertThat(summary.likes().current()).isEqualTo(1);
        assertThat(summary.published().current()).isEqualTo(1);
        assertThat(summary.topViewed()).singleElement().satisfies(row -> {
            assertThat(row.id()).isEqualTo(published);
            assertThat(row.views()).isEqualTo(5);
        });
        assertThat(summary.byTypeAndStatus().get(ContentType.GALLERY))
                .containsEntry("PUBLISHED", 1L).containsEntry("IN_REVIEW", 1L);
        assertThat(summary.pendingCount()).isEqualTo(1);
        assertThat(summary.recent()).hasSize(2);
        assertThat(summary.ads()).as("sin módulo de publicidad").isNull();
        assertThat(summary.byTypeAndStatus()).doesNotContainKey(ContentType.ARTICLE);
    }

    @Test
    void rejectsUnknownRangeAndAnonymousCallers() throws Exception {
        String token = login(LegacyRole.AUTHOR);

        mockMvc.perform(get("/api/v1/admin/dashboard?range=7").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rangeDays").value(7))
                .andExpect(jsonPath("$.series.length()").value(7));
        mockMvc.perform(get("/api/v1/admin/dashboard?range=5").header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/admin/dashboard")).andExpect(status().isForbidden());
    }

    @Test
    void workerWithoutContentModulesIsDenied() throws Exception {
        String token = login(LegacyRole.USER);

        mockMvc.perform(get("/api/v1/admin/dashboard").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private UUID gallery(UUID author, String status) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO galleries.galleries (id, slug, title, status, author_id, category_id, published_at)
                VALUES (?, ?, 'Galería inicio', ?, ?, ?, CASE WHEN ?::text = 'PUBLISHED' THEN now() END)
                """, id, "galeria-inicio-" + id, status, author, UUID.randomUUID(), status);
        return id;
    }

    private void views(UUID gallery, LocalDate day, long count) {
        jdbc.update("INSERT INTO engagement.content_views_daily (day, content_type, content_id, views) VALUES (?, 'GALLERY', ?, ?)",
                Date.valueOf(day), gallery, count);
    }

    private String login(LegacyRole role) throws Exception {
        String email = "dashboard-" + UUID.randomUUID() + "@plataforma-contenidos.test";
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role.toRole()));
        role.grant(workerPermissions, created.getId());
        String body = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("accessToken").asText();
    }
}
