package pe.plataformacontenidos.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.LocalDateTime;
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
import pe.plataformacontenidos.dashboard.CalendarService.Entry;
import pe.plataformacontenidos.dashboard.CalendarService.Kind;
import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;
import pe.plataformacontenidos.identity.internal.WorkerPermissionRepository;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.Permissions;
import pe.plataformacontenidos.identity.permission.TestProfile;
import tools.jackson.databind.ObjectMapper;

/** Calendario del panel: lo publicado, lo programado y las fechas de celebración de un mes, según permisos. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class CalendarIntegrationTest {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");

    @Autowired
    private CalendarService calendarService;

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
     * Mes lejano (2093) para no chocar con datos de otras pruebas: la base es compartida.
     * La hora se guarda en UTC y el día se calcula en Lima (las 23:30 del 14 en Lima son el 15 en UTC).
     */
    @Test
    void showsScheduledPublishedAndCelebrationDatesOfTheMonthInSiteTime() {
        UUID scheduled = gallery("SCHEDULED", "scheduled_at", lima(2093, 6, 14, 23, 30));
        UUID published = gallery("PUBLISHED", "published_at", lima(2093, 6, 2, 9, 0));
        UUID draft = gallery("DRAFT", "scheduled_at", lima(2093, 6, 20, 10, 0));
        UUID otherMonth = gallery("SCHEDULED", "scheduled_at", lima(2093, 7, 1, 0, 30));
        UUID yearly = celebration(true, lima(1990, 6, 24, 0, 0));
        UUID once = celebration(false, lima(2093, 6, 10, 18, 0));

        CalendarService.Month month = calendarService.month(owner(), "2093-06");

        assertThat(month.month()).isEqualTo("2093-06");
        assertThat(month.entries()).extracting(Entry::id).doesNotContain(draft, otherMonth);
        assertThat(month.entries()).filteredOn(e -> e.id().equals(scheduled)).singleElement()
                .satisfies(e -> {
                    assertThat(e.kind()).isEqualTo(Kind.SCHEDULED);
                    assertThat(e.type()).isEqualTo(ContentType.GALLERY);
                    assertThat(e.date()).isEqualTo("2093-06-14");
                    assertThat(e.time()).isEqualTo("23:30");
                });
        assertThat(month.entries()).filteredOn(e -> e.id().equals(published)).singleElement()
                .satisfies(e -> assertThat(e.kind()).isEqualTo(Kind.PUBLISHED));
        assertThat(month.entries()).filteredOn(e -> e.id().equals(yearly)).singleElement()
                .satisfies(e -> {
                    assertThat(e.kind()).isEqualTo(Kind.CELEBRATION_DATE);
                    assertThat(e.date()).as("se repite cada año: cae en su día de este mes").isEqualTo("2093-06-24");
                    assertThat(e.time()).isNull();
                });
        assertThat(month.entries()).filteredOn(e -> e.id().equals(once)).singleElement()
                .satisfies(e -> assertThat(e.date()).isEqualTo("2093-06-10"));
        assertThat(month.entries()).extracting(Entry::date).isSorted();
    }

    @Test
    void onlyTheModulesTheWorkerHas() {
        UUID scheduled = gallery("SCHEDULED", "scheduled_at", lima(2094, 3, 5, 12, 0));
        UUID yearly = celebration(true, lima(2000, 3, 8, 0, 0));

        CalendarService.Month month = calendarService.month(
                new Permissions(UUID.randomUUID(), false, true, false, Map.of(Module.GALLERIES, AccessLevel.PUBLISH)),
                "2094-03");

        assertThat(month.entries()).extracting(Entry::id).contains(scheduled).doesNotContain(yearly);
        assertThat(month.entries()).extracting(Entry::type).containsOnly(ContentType.GALLERY);
    }

    @Test
    void rejectsBadMonthsAndCallersWithoutContentModules() throws Exception {
        assertThatThrownBy(() -> calendarService.month(owner(), "2093-13")).isInstanceOf(InvalidCalendarMonthException.class);
        assertThatThrownBy(() -> calendarService.month(owner(), "1800-01")).isInstanceOf(InvalidCalendarMonthException.class);

        String token = login(TestProfile.SOLO_CONTENIDO);
        mockMvc.perform(get("/api/v1/admin/calendar?month=2093-06").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.month").value("2093-06"));
        mockMvc.perform(get("/api/v1/admin/calendar?month=junio").header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/admin/calendar")).andExpect(status().isForbidden());

        String noModules = login(TestProfile.SIN_PERMISOS);
        mockMvc.perform(get("/api/v1/admin/calendar").header("Authorization", "Bearer " + noModules))
                .andExpect(status().isForbidden());
    }

    private static Permissions owner() {
        return new Permissions(UUID.randomUUID(), true, true, false, Map.of());
    }

    private static Timestamp lima(int year, int month, int day, int hour, int minute) {
        return Timestamp.from(LocalDateTime.of(year, month, day, hour, minute).atZone(LIMA).toInstant());
    }

    private UUID gallery(String status, String dateColumn, Timestamp at) {
        UUID id = UUID.randomUUID();
        // dateColumn es una constante de esta prueba (scheduled_at / published_at), nunca dato externo.
        jdbc.update("INSERT INTO galleries.galleries (id, slug, title, status, author_id, category_id, " + dateColumn
                + ") VALUES (?, ?, 'Galería calendario', ?, ?, ?, ?)",
                id, "galeria-calendario-" + id, status, UUID.randomUUID(), UUID.randomUUID(), at);
        return id;
    }

    private UUID celebration(boolean recursYearly, Timestamp startsAt) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO celebrations.celebrations
                    (id, slug, title, body, status, author_id, category_id, starts_at, recurs_yearly, next_occurrence)
                VALUES (?, ?, 'Celebración calendario', '<p>Texto</p>', 'PUBLISHED', ?, ?, ?, ?, ?)
                """, id, "celebracion-calendario-" + id, UUID.randomUUID(), UUID.randomUUID(), startsAt, recursYearly,
                startsAt);
        return id;
    }

    private String login(TestProfile role) throws Exception {
        String email = "calendar-" + UUID.randomUUID() + "@plataforma-contenidos.test";
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
