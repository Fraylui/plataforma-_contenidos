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
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.TestProfile;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.Permissions;
import pe.plataformacontenidos.identity.internal.WorkerPermissionRepository;
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

    /**
     * Quien tiene un módulo ve todo lo de ese módulo (no solo lo suyo) y nada de
     * los otros. La base de pruebas es compartida entre clases: las cifras se
     * comprueban como "al menos", con un volumen de visitas que ninguna otra
     * prueba alcanza para que el contenido de esta encabece "Lo más visto".
     */
    @Test
    void workerSeesEverythingInTheirModulesWithRealTotalsAndPreviousPeriod() {
        UUID worker = UUID.randomUUID();
        UUID mine = gallery(worker, "PUBLISHED");
        UUID teammates = gallery(UUID.randomUUID(), "PUBLISHED");
        views(mine, TODAY, 1_000_000);
        views(teammates, TODAY, 900_000);
        views(mine, TODAY.minusDays(10), 3);
        jdbc.update("INSERT INTO engagement.content_likes (content_type, content_id, visitor_id) VALUES ('GALLERY', ?, ?)",
                mine, UUID.randomUUID());

        DashboardSummary summary = dashboardService.summary(
                new Permissions(worker, false, true, false, Map.of(Module.GALLERIES, AccessLevel.PUBLISH)), 7);

        assertThat(summary.series()).hasSize(7);
        assertThat(summary.views().current()).isGreaterThanOrEqualTo(1_900_000);
        assertThat(summary.views().previous()).isGreaterThanOrEqualTo(3);
        assertThat(summary.likes().current()).isGreaterThanOrEqualTo(1);
        assertThat(summary.published().current()).isGreaterThanOrEqualTo(2);
        assertThat(summary.topViewed()).extracting(DashboardSummary.TopRow::id).startsWith(mine, teammates);
        assertThat(summary.byTypeAndStatus()).containsOnlyKeys(ContentType.GALLERY);
        assertThat(summary.recent()).isNotEmpty();
        assertThat(summary.ads()).as("sin módulo de publicidad").isNull();
    }

    @Test
    void rejectsUnknownRangeAndAnonymousCallers() throws Exception {
        String token = login(TestProfile.SOLO_CONTENIDO);

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
        String token = login(TestProfile.SIN_PERMISOS);

        mockMvc.perform(get("/api/v1/admin/dashboard").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private UUID gallery(UUID creator, String status) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO galleries.galleries (id, slug, title, status, author_id, category_id, published_at)
                VALUES (?, ?, 'Galería inicio', ?, ?, ?, CASE WHEN ?::text = 'PUBLISHED' THEN now() END)
                """, id, "galeria-inicio-" + id, status, creator, UUID.randomUUID(), status);
        return id;
    }

    /**
     * Los episodios llegan solos desde YouTube: entran a «Lo más visto» con su
     * enlace "serie/episodio", pero no llenan «Contenido reciente».
     */
    @Test
    void episodesRankByViewsWithTheirSeriesPathButStayOutOfRecent() {
        UUID worker = UUID.randomUUID();
        UUID series = UUID.randomUUID();
        UUID episode = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO series.series (id, slug, title, status, author_id, category_id, youtube_playlist_id, published_at)
                VALUES (?, ?, 'Serie inicio', 'PUBLISHED', ?, ?, ?, now())
                """, series, "serie-inicio-" + series, worker, UUID.randomUUID(), "PL" + series);
        jdbc.update("""
                INSERT INTO series.episodes (id, series_id, youtube_video_id, slug, title, status, published_at)
                VALUES (?, ?, ?, 'capitulo-uno', 'Capítulo uno', 'PUBLISHED', now())
                """, episode, series, "v" + episode.toString().substring(0, 10));
        jdbc.update("INSERT INTO engagement.content_views_daily (day, content_type, content_id, views) VALUES (?, 'EPISODE', ?, ?)",
                Date.valueOf(TODAY), episode, 5_000_000);

        DashboardSummary summary = dashboardService.summary(
                new Permissions(worker, false, true, false, Map.of(Module.SERIES, AccessLevel.PUBLISH)), 7);

        assertThat(summary.topViewed().get(0).slug()).isEqualTo("serie-inicio-" + series + "/capitulo-uno");
        assertThat(summary.recent()).extracting(DashboardSummary.ContentRow::type).doesNotContain(ContentType.EPISODE);
    }

    private void views(UUID gallery, LocalDate day, long count) {
        jdbc.update("INSERT INTO engagement.content_views_daily (day, content_type, content_id, views) VALUES (?, 'GALLERY', ?, ?)",
                Date.valueOf(day), gallery, count);
    }

    private String login(TestProfile role) throws Exception {
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
