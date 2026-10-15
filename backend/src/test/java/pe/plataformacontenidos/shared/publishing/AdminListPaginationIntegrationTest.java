package pe.plataformacontenidos.shared.publishing;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import pe.plataformacontenidos.identity.permission.LegacyRole;
import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import tools.jackson.databind.ObjectMapper;

/** Listados del panel paginados en el servidor (hoja de ruta F3) — se prueba con Galerías, la misma AdminListQuery sirve a los 5 tipos. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class AdminListPaginationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkerPermissionRepository workerPermissions;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void publisherPagesSearchesAndFiltersByStatus() throws Exception {
        Login publisher = login(LegacyRole.EDITOR);
        String tag = "pag" + UUID.randomUUID().toString().substring(0, 8);
        gallery(UUID.randomUUID(), "Uno " + tag, "DRAFT");
        UUID second = gallery(UUID.randomUUID(), "Dos " + tag, "IN_REVIEW");
        jdbc.update("INSERT INTO engagement.content_views_daily (day, content_type, content_id, views)"
                + " VALUES (CURRENT_DATE, 'GALLERY', ?, 7)", second);
        gallery(UUID.randomUUID(), "Tres " + tag.toUpperCase(), "PUBLISHED");

        mockMvc.perform(get("/api/v1/admin/galleries").param("q", tag).param("size", "2")
                        .header("Authorization", publisher.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/api/v1/admin/galleries").param("q", tag).param("status", "IN_REVIEW")
                        .header("Authorization", publisher.bearer()))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].title").value("Dos " + tag))
                .andExpect(jsonPath("$.engagement['" + second + "'].views").value(7))
                .andExpect(jsonPath("$.engagement['" + second + "'].likes").value(0));

        mockMvc.perform(get("/api/v1/admin/galleries").param("q", tag).param("sort", "title,asc")
                        .header("Authorization", publisher.bearer()))
                .andExpect(jsonPath("$.items[0].title").value("Dos " + tag));
    }

    @Test
    void creatorOnlySeesOwnContent() throws Exception {
        Login creator = login(LegacyRole.AUTHOR);
        String tag = "own" + UUID.randomUUID().toString().substring(0, 8);
        gallery(creator.userId(), "Mía " + tag, "DRAFT");
        gallery(UUID.randomUUID(), "Ajena " + tag, "DRAFT");

        mockMvc.perform(get("/api/v1/admin/galleries").param("q", tag).header("Authorization", creator.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].title").value("Mía " + tag));
    }

    @Test
    void unknownStatusIsBadRequestAndSizeIsCapped() throws Exception {
        Login publisher = login(LegacyRole.EDITOR);

        mockMvc.perform(get("/api/v1/admin/galleries").param("status", "FOO").header("Authorization", publisher.bearer()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/admin/galleries").param("size", "5000").header("Authorization", publisher.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(AdminListQuery.MAX_SIZE));
    }

    private UUID gallery(UUID author, String title, String status) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO galleries.galleries (id, slug, title, status, author_id, category_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """, id, "galeria-lista-" + id, title, status, author, UUID.randomUUID());
        return id;
    }

    private record Login(UUID userId, String token) {
        String bearer() {
            return "Bearer " + token;
        }
    }

    private Login login(LegacyRole role) throws Exception {
        String email = "lista-" + UUID.randomUUID() + "@plataforma-contenidos.test";
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role.toRole()));
        role.grant(workerPermissions, created.getId());
        String body = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return new Login(created.getId(), objectMapper.readTree(body).get("accessToken").asText());
    }
}
