package pe.plataformacontenidos.affiliates;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
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
import pe.plataformacontenidos.affiliates.AffiliateLinkService.LinkInput;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;
import pe.plataformacontenidos.identity.internal.WorkerPermissionRepository;
import pe.plataformacontenidos.identity.permission.TestProfile;
import tools.jackson.databind.ObjectMapper;

/** Enlaces de afiliado: se editan en el panel, se ven solo en lo publicado y el clic se cuenta y redirige. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class AffiliateLinkIntegrationTest {

    private static final String BROWSER = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36";

    @Autowired
    private AffiliateLinkService service;

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
    void editorSavesLinksPublicSeesThemOnlyWhenPublishedAndClicksRedirectAndCount() throws Exception {
        UUID place = place("DRAFT");
        String token = login(TestProfile.SOLO_CONTENIDO);
        String body = """
                {"links":[{"label":"Tour a Kuélap","url":"https://www.civitatis.com/es/chachapoyas/?aid=1"},
                          {"label":"Hotel cerca","url":"https://www.booking.com/hotel/pe/x.html?aid=2"}]}
                """;

        mockMvc.perform(put("/api/v1/admin/affiliate-links/PLACE/" + place).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].label").value("Tour a Kuélap"))
                .andExpect(jsonPath("$[0].clicks").value(0));

        // Borrador: el sitio no muestra nada ni redirige.
        mockMvc.perform(get("/api/v1/affiliate-links?type=PLACE&id=" + place))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        UUID first = service.list(ContentType.PLACE, place).get(0).id();
        mockMvc.perform(get("/api/v1/affiliate-links/" + first + "/go")).andExpect(status().isNotFound());

        jdbc.update("UPDATE places.places SET status = 'PUBLISHED', published_at = now() WHERE id = ?", place);
        mockMvc.perform(get("/api/v1/affiliate-links?type=PLACE&id=" + place))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].label").value("Tour a Kuélap"))
                .andExpect(jsonPath("$[0].store").value("civitatis.com"))
                .andExpect(jsonPath("$[0].url").doesNotExist());

        mockMvc.perform(get("/api/v1/affiliate-links/" + first + "/go").header("User-Agent", BROWSER))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://www.civitatis.com/es/chachapoyas/?aid=1"));
        // El mismo visitante otra vez: redirige, pero no suma dos veces.
        mockMvc.perform(get("/api/v1/affiliate-links/" + first + "/go").header("User-Agent", BROWSER))
                .andExpect(status().isFound());
        assertThat(service.list(ContentType.PLACE, place).get(0).clicks()).isEqualTo(1);

        // Reordenar conserva los clics de cada dirección.
        service.replace(ContentType.PLACE, place, List.of(
                new LinkInput("Hotel cerca", "https://www.booking.com/hotel/pe/x.html?aid=2"),
                new LinkInput("Tour a Kuélap (nuevo nombre)", "https://www.civitatis.com/es/chachapoyas/?aid=1")));
        assertThat(service.list(ContentType.PLACE, place)).extracting(AffiliateLink::label, AffiliateLink::clicks)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Hotel cerca", 0L),
                        org.assertj.core.groups.Tuple.tuple("Tour a Kuélap (nuevo nombre)", 1L));
    }

    @Test
    void rejectsBadLinksMissingContentAndWorkersWithoutTheModule() throws Exception {
        UUID place = place("DRAFT");
        String token = login(TestProfile.SOLO_CONTENIDO);

        mockMvc.perform(put("/api/v1/admin/affiliate-links/PLACE/" + place).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"links\":[{\"label\":\"Malo\",\"url\":\"http://tienda.pe\"}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/v1/admin/affiliate-links/PLACE/" + UUID.randomUUID()).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"links\":[]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/admin/affiliate-links/GALLERY/" + place).header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        String noModules = login(TestProfile.SIN_PERMISOS);
        mockMvc.perform(get("/api/v1/admin/affiliate-links/PLACE/" + place).header("Authorization", "Bearer " + noModules))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/affiliate-links/PLACE/" + place)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/affiliate-links?type=NADA&id=" + place)).andExpect(status().isBadRequest());
    }

    private UUID place(String status) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO places.places (id, slug, name, body, status, author_id, category_id)
                VALUES (?, ?, 'Lugar con afiliados', '<p>Texto</p>', ?, ?, ?)
                """, id, "lugar-afiliados-" + id, status, UUID.randomUUID(), UUID.randomUUID());
        return id;
    }

    private String login(TestProfile role) throws Exception {
        String email = "affiliates-" + UUID.randomUUID() + "@plataforma-contenidos.test";
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role.toRole()));
        role.grant(workerPermissions, created.getId());
        String response = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }
}
