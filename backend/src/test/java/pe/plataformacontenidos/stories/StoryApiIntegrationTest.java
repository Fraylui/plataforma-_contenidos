package pe.plataformacontenidos.stories;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.engagement.ContentViewFlushJob;
import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;
import pe.plataformacontenidos.identity.internal.WorkerPermissionRepository;
import pe.plataformacontenidos.identity.permission.TestProfile;
import pe.plataformacontenidos.stories.StoryService.StoryItem;
import pe.plataformacontenidos.taxonomy.CategoryService;
import tools.jackson.databind.ObjectMapper;

/** Historias por HTTP: lo que ve el visitante (fila, visor, toques) y lo que gestiona el panel. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class StoryApiIntegrationTest {

    private static final UUID AUTHOR = UUID.randomUUID();

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private StoryService stories;
    @Autowired private CategoryService categories;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private ContentViewFlushJob flushJob;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkerPermissionRepository workerPermissions;
    @Autowired private PasswordEncoder passwordEncoder;

    private UUID older;
    private UUID newer;

    @BeforeEach
    void topics() {
        older = categories.create("Historias A " + UUID.randomUUID(), null, null).getId();
        newer = categories.create("Historias B " + UUID.randomUUID(), null, null).getId();
    }

    // ---------- público ----------

    @Test
    void activeGroupsByTopicNewestTopicFirst() throws Exception {
        Story first = story(older, "Primera");
        story(newer, "Segunda");
        story(older, "Tercera");
        jdbc.update("UPDATE stories.stories SET published_at = published_at - interval '2 hours' WHERE id = ?", first.getId());

        String json = mockMvc.perform(get("/api/v1/stories/active")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<String> order = objectMapper.readTree(json).valueStream()
                .map(topic -> topic.get("category").get("id").asText())
                .filter(id -> id.equals(older.toString()) || id.equals(newer.toString())).toList();

        // «Tercera» es la más nueva: su tema va primero, y dentro del tema van en orden de publicación.
        assertThat(order).containsExactly(older.toString(), newer.toString());
        mockMvc.perform(get("/api/v1/stories/active"))
                .andExpect(jsonPath("$[?(@.category.id == '" + older + "')].stories[0].caption").value("Primera"))
                .andExpect(jsonPath("$[?(@.category.id == '" + older + "')].stories[1].caption").value("Tercera"));
    }

    @Test
    void activeHidesInactiveTopic() throws Exception {
        story(older, "Tema apagado");
        categories.setActive(older, false);

        mockMvc.perform(get("/api/v1/stories/active"))
                .andExpect(jsonPath("$[?(@.category.id == '" + older + "')]").isEmpty());
    }

    @Test
    void expiredIsNotFoundUnlessHighlighted() throws Exception {
        Story gone = story(older, "Se fue");
        Story kept = story(older, "Se queda");
        stories.setHighlighted(kept.getId(), true, AUTHOR);
        jdbc.update("UPDATE stories.stories SET expires_at = now() - interval '1 minute' WHERE id IN (?, ?)",
                gone.getId(), kept.getId());

        mockMvc.perform(get("/api/v1/stories/" + gone.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/stories/" + kept.getId())).andExpect(status().isOk())
                .andExpect(jsonPath("$.story.highlighted").value(true))
                .andExpect(jsonPath("$.category.id").value(older.toString()));
        mockMvc.perform(get("/api/v1/stories/highlights").param("categoryId", older.toString()))
                .andExpect(jsonPath("$[0].id").value(kept.getId().toString()));
    }

    @Test
    void ctaCountsOncePerVisitorWithin30Minutes() throws Exception {
        Story story = story(older, "Ver más");

        mockMvc.perform(visitor(post("/api/v1/stories/" + story.getId() + "/cta"), "10.1.1.1", "Navegador A"))
                .andExpect(status().isNoContent());
        mockMvc.perform(visitor(post("/api/v1/stories/" + story.getId() + "/cta"), "10.1.1.1", "Navegador A"))
                .andExpect(status().isNoContent());
        assertThat(ctaClicks(story)).isEqualTo(1);

        mockMvc.perform(visitor(post("/api/v1/stories/" + story.getId() + "/cta"), "10.1.1.1", "Navegador B"));
        assertThat(ctaClicks(story)).isEqualTo(2);

        // Un id inventado también responde 204: un script no aprende nada.
        mockMvc.perform(visitor(post("/api/v1/stories/" + UUID.randomUUID() + "/cta"), "10.1.1.2", "Navegador C"))
                .andExpect(status().isNoContent());
    }

    @Test
    void likeTogglesAndCounts() throws Exception {
        Story story = story(older, "Me gusta");
        String visitor = UUID.randomUUID().toString();

        mockMvc.perform(post("/api/v1/stories/" + story.getId() + "/like").param("visitorId", visitor))
                .andExpect(status().isOk()).andExpect(jsonPath("$.liked").value(true)).andExpect(jsonPath("$.likeCount").value(1));
        mockMvc.perform(get("/api/v1/stories/" + story.getId())).andExpect(jsonPath("$.story.likeCount").value(1));
        mockMvc.perform(post("/api/v1/stories/" + story.getId() + "/like").param("visitorId", visitor))
                .andExpect(jsonPath("$.liked").value(false));
    }

    @Test
    void viewOfStoryIsFlushed() throws Exception {
        Story story = story(older, "Vista");

        mockMvc.perform(visitor(post("/api/v1/views"), "10.2.2.2", "Navegador vista")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"STORY\",\"id\":\"" + story.getId() + "\"}"))
                .andExpect(status().isNoContent());
        flushJob.flush();

        assertThat(jdbc.queryForObject("SELECT coalesce(sum(views), 0) FROM engagement.content_views_daily"
                + " WHERE content_type = 'STORY' AND content_id = ?", Long.class, story.getId())).isEqualTo(1);
    }

    // ---------- panel ----------

    @Test
    void workerWithoutStoriesModuleGets403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stories").header("Authorization", "Bearer " + login(TestProfile.SIN_PERMISOS)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createsABatchFromThePanel() throws Exception {
        String token = login(TestProfile.SOLO_CONTENIDO);
        mockMvc.perform(post("/api/v1/admin/stories").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(batch(older, 2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].categoryId").value(older.toString()))
                .andExpect(jsonPath("$[0].expiresAt").isNotEmpty());
    }

    @Test
    void batchOfElevenIs400() throws Exception {
        mockMvc.perform(post("/api/v1/admin/stories").header("Authorization", "Bearer " + login(TestProfile.SOLO_CONTENIDO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(batch(older, 11)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("10")));
    }

    @Test
    void endedTabShowsLast7DaysOnly() throws Exception {
        Story recent = story(older, "Terminó ayer");
        Story ancient = story(older, "Terminó hace mucho");
        jdbc.update("UPDATE stories.stories SET expires_at = now() - interval '1 day' WHERE id = ?", recent.getId());
        jdbc.update("UPDATE stories.stories SET expires_at = now() - interval '8 days' WHERE id = ?", ancient.getId());

        String token = login(TestProfile.SOLO_CONTENIDO);
        mockMvc.perform(get("/api/v1/admin/stories").param("tab", "ENDED").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[?(@.id == '" + recent.getId() + "')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.id == '" + ancient.getId() + "')]").isEmpty());
    }

    @Test
    void adminStoryIncludesViewsAndCta() throws Exception {
        Story story = story(older, "Métricas");
        mockMvc.perform(visitor(post("/api/v1/stories/" + story.getId() + "/cta"), "10.3.3.3", "Navegador métricas"));
        jdbc.update("INSERT INTO engagement.content_views_daily (day, content_type, content_id, views) VALUES (current_date, 'STORY', ?, 7)",
                story.getId());

        mockMvc.perform(get("/api/v1/admin/stories").param("tab", "ACTIVE")
                        .header("Authorization", "Bearer " + login(TestProfile.SOLO_CONTENIDO)))
                .andExpect(jsonPath("$[?(@.id == '" + story.getId() + "')].views").value(7))
                .andExpect(jsonPath("$[?(@.id == '" + story.getId() + "')].ctaClicks").value(1))
                .andExpect(jsonPath("$[?(@.id == '" + story.getId() + "')].categoryName").isNotEmpty());
    }

    // ---------- ayudas ----------

    private Story story(UUID categoryId, String caption) {
        return stories.createBatch(categoryId, List.of(new StoryItem(null, Story.Background.SUNSET, caption,
                Story.CaptionPosition.CENTER, null, null, null, false)), AUTHOR).getFirst();
    }

    private int ctaClicks(Story story) {
        return jdbc.queryForObject("SELECT cta_clicks FROM stories.stories WHERE id = ?", Integer.class, story.getId());
    }

    private static MockHttpServletRequestBuilder visitor(MockHttpServletRequestBuilder request, String ip, String userAgent) {
        return request.header("User-Agent", userAgent).with(r -> {
            r.setRemoteAddr(ip);
            return r;
        });
    }

    private static String batch(UUID categoryId, int size) {
        String item = "{\"background\":\"OCEAN\",\"caption\":\"Hola\",\"captionPosition\":\"CENTER\"}";
        return "{\"categoryId\":\"" + categoryId + "\",\"items\":[" + String.join(",", Collections.nCopies(size, item)) + "]}";
    }

    private String login(TestProfile profile) throws Exception {
        String email = "stories-" + UUID.randomUUID() + "@plataforma-contenidos.test";
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
