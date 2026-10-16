package pe.plataformacontenidos.series;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import pe.plataformacontenidos.identity.permission.TestProfile;
import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Series conectadas a una lista de YouTube (YouTube simulado): crear con el
 * link de la lista trae los episodios ya publicados; sincronizar agrega solo
 * los nuevos; un fallo de YouTube queda en la serie sin romper nada.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class SeriesIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkerPermissionRepository workerPermissions;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private SeriesSyncJob syncJob;

    @MockitoBean private YouTubePlaylistFeed feed;

    private final List<YouTubePlaylistFeed.FeedEntry> entries = new ArrayList<>();
    private String token;
    private String playlistId;

    @BeforeEach
    void setUp() throws Exception {
        playlistId = "PL" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        entries.clear();
        entries.add(entry("aaaaaaaaaa1", "Episodio 1: Nazca", "2026-10-01T15:00:00Z"));
        entries.add(entry("aaaaaaaaaa2", "Episodio 2: Machu Picchu", "2026-10-10T15:00:00Z"));
        when(feed.fetch(anyString())).thenAnswer(inv -> new YouTubePlaylistFeed.Feed("Curiosidades del mundo", List.copyOf(entries)));
        token = login(TestProfile.SOLO_CONTENIDO);
    }

    @Test
    void createImportsEpisodesAndPublicSiteShowsThemOncePublished() throws Exception {
        JsonNode series = createSeries();
        String id = series.get("id").asText();
        String slug = series.get("slug").asText();
        assertThat(series.get("title").asText()).isEqualTo("Curiosidades del mundo");

        // En borrador la serie no se ve en el sitio
        mockMvc.perform(get("/api/v1/series/" + slug)).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/series/" + id + "/publish").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/series/" + slug + "/episodes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items[0].title").value("Episodio 2: Machu Picchu"));

        mockMvc.perform(get("/api/v1/series/" + slug + "/episodes/episodio-1-nazca"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.episode.youtubeVideoId").value("aaaaaaaaaa1"))
                .andExpect(jsonPath("$.newer.slug").value("episodio-2-machu-picchu"))
                .andExpect(jsonPath("$.older").doesNotExist());

        mockMvc.perform(get("/api/v1/series"))
                .andExpect(jsonPath("$.items[?(@.series.slug == '" + slug + "')].episodeCount").value(2));
    }

    /** Fase 2: los episodios son contenido de la plataforma — entran al feed y reciben "me gusta". */
    @Test
    void publishedEpisodesJoinTheFeedAndReceiveLikes() throws Exception {
        JsonNode series = createSeries();
        String id = series.get("id").asText();
        String slug = series.get("slug").asText();
        mockMvc.perform(post("/api/v1/admin/series/" + id + "/publish").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/feed").param("type", "EPISODE").param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.seriesSlug == '" + slug + "')].youtubeVideoId", org.hamcrest.Matchers.hasItem("aaaaaaaaaa1")));

        String episodeId = objectMapper.readTree(mockMvc.perform(get("/api/v1/series/" + slug + "/episodes/episodio-1-nazca"))
                .andReturn().getResponse().getContentAsString()).get("episode").get("id").asText();
        String visitor = UUID.randomUUID().toString();
        mockMvc.perform(post("/api/v1/series/episodes/" + episodeId + "/like").param("visitorId", visitor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.likeCount").value(1));
        mockMvc.perform(get("/api/v1/series/" + slug + "/episodes/episodio-1-nazca"))
                .andExpect(jsonPath("$.likeCount").value(1));

        // Un episodio de una serie en borrador no se puede "gustar"
        mockMvc.perform(post("/api/v1/admin/series/" + id + "/archive").header("Authorization", "Bearer " + token));
        mockMvc.perform(post("/api/v1/series/episodes/" + episodeId + "/like").param("visitorId", visitor))
                .andExpect(status().isNotFound());
    }

    @Test
    void syncAddsOnlyNewVideosAndRecordsYouTubeFailures() throws Exception {
        String id = createSeries().get("id").asText();

        entries.add(entry("aaaaaaaaaa3", "Episodio 3: Titicaca", "2026-10-14T15:00:00Z"));
        mockMvc.perform(post("/api/v1/admin/series/" + id + "/sync").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.added").value(1))
                .andExpect(jsonPath("$.lastSyncError").doesNotExist());

        // La tarea periódica tampoco duplica
        syncJob.syncAll();
        mockMvc.perform(get("/api/v1/admin/series/" + id + "/episodes").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.totalElements").value(3));

        when(feed.fetch(anyString())).thenThrow(new PlaylistFeedException("No se pudo conectar con YouTube."));
        mockMvc.perform(post("/api/v1/admin/series/" + id + "/sync").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.added").value(0))
                .andExpect(jsonPath("$.lastSyncError").value("No se pudo conectar con YouTube."));
    }

    @Test
    void archivedEpisodeDisappearsFromTheSiteAndNotesAreSanitized() throws Exception {
        JsonNode series = createSeries();
        String id = series.get("id").asText();
        mockMvc.perform(post("/api/v1/admin/series/" + id + "/publish").header("Authorization", "Bearer " + token));
        String episodeId = objectMapper.readTree(mockMvc.perform(get("/api/v1/admin/series/" + id + "/episodes")
                        .header("Authorization", "Bearer " + token)).andReturn().getResponse().getContentAsString())
                .get("items").get(0).get("id").asText();

        mockMvc.perform(put("/api/v1/admin/series/" + id + "/episodes/" + episodeId)
                        .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"<p>Lo que verás</p><script>alert(1)</script>\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("<p>Lo que verás</p>"));

        mockMvc.perform(post("/api/v1/admin/series/" + id + "/episodes/" + episodeId + "/archive")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/series/" + series.get("slug").asText() + "/episodes"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void rejectsLinksThatAreNotPlaylistsAndDuplicates() throws Exception {
        mockMvc.perform(post("/api/v1/admin/series").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"playlistUrl\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\",\"categoryId\":\"" + category() + "\"}"))
                .andExpect(status().isBadRequest());

        createSeries();
        mockMvc.perform(post("/api/v1/admin/series").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"playlistUrl\":\"" + playlistId + "\",\"categoryId\":\"" + category() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Esa lista de YouTube ya está conectada a otra serie."));
    }

    @Test
    void coverImageMustExistAndCanBeCleared() throws Exception {
        JsonNode series = createSeries();
        String id = series.get("id").asText();
        String category = series.get("categoryId").asText();

        mockMvc.perform(put("/api/v1/admin/series/" + id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"" + category + "\",\"coverImageId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La imagen de portada ya no existe en la biblioteca."));

        mockMvc.perform(put("/api/v1/admin/series/" + id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"" + category + "\",\"coverImageId\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coverImageId").doesNotExist());
    }

    /** Los episodios se encuentran en el buscador: por su título y por el nombre del programa. */
    @Test
    void publishedEpisodesAreSearchableByTitleAndBySeriesName() throws Exception {
        entries.add(entry("aaaaaaaaaa4", "Episodio 4: el quirquinchozafiro", "2026-10-12T15:00:00Z"));
        String body = mockMvc.perform(post("/api/v1/admin/series").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"playlistUrl\":\"" + playlistId + "\",\"title\":\"Viajes vicuñatronicos\",\"categoryId\":\""
                                + category() + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode series = objectMapper.readTree(body);
        String id = series.get("id").asText();
        String slug = series.get("slug").asText();

        // Serie en borrador: sus episodios no salen
        mockMvc.perform(get("/api/v1/search").param("q", "quirquinchozafiro"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        mockMvc.perform(post("/api/v1/admin/series/" + id + "/publish").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/search").param("q", "quirquinchozafiro"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].contentType").value("EPISODE"))
                .andExpect(jsonPath("$.items[0].slug").value("episodio-4-el-quirquinchozafiro"))
                .andExpect(jsonPath("$.items[0].seriesSlug").value(slug))
                .andExpect(jsonPath("$.items[0].featuredImageUrl").value("https://i.ytimg.com/vi/aaaaaaaaaa4/hqdefault.jpg"));

        // Sin tilde y por el nombre del programa: trae todos sus episodios
        mockMvc.perform(get("/api/v1/search").param("q", "vicunatronicos").param("type", "EPISODE"))
                .andExpect(jsonPath("$.totalElements").value(3));

        // Un episodio archivado deja de aparecer
        String episodeId = objectMapper.readTree(mockMvc.perform(get("/api/v1/admin/series/" + id + "/episodes")
                        .header("Authorization", "Bearer " + token)).andReturn().getResponse().getContentAsString())
                .get("items").get(0).get("id").asText();
        mockMvc.perform(post("/api/v1/admin/series/" + id + "/episodes/" + episodeId + "/archive")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/search").param("q", "quirquinchozafiro"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void withoutTheSeriesModuleThePanelIsClosed() throws Exception {
        String outsider = login(TestProfile.SIN_PERMISOS);
        mockMvc.perform(get("/api/v1/admin/series").header("Authorization", "Bearer " + outsider))
                .andExpect(status().isForbidden());
    }

    private JsonNode createSeries() throws Exception {
        String body = mockMvc.perform(post("/api/v1/admin/series").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"playlistUrl\":\"https://www.youtube.com/playlist?list=" + playlistId
                                + "\",\"categoryId\":\"" + category() + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }

    private String categoryId;

    private String category() throws Exception {
        if (categoryId == null) {
            String owner = login(TestProfile.DUENO);
            String body = mockMvc.perform(post("/api/v1/admin/categories").header("Authorization", "Bearer " + owner)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Curiosidades " + UUID.randomUUID().toString().substring(0, 8) + "\"}"))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            categoryId = objectMapper.readTree(body).get("id").asText();
        }
        return categoryId;
    }

    private static YouTubePlaylistFeed.FeedEntry entry(String videoId, String title, String published) {
        return new YouTubePlaylistFeed.FeedEntry(videoId, title, null, Instant.parse(published));
    }

    private String login(TestProfile profile) throws Exception {
        String email = "series-" + UUID.randomUUID() + "@plataforma-contenidos.test";
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", profile.toRole()));
        profile.grant(workerPermissions, created.getId());
        String body = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("accessToken").asText();
    }
}
