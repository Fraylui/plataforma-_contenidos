package pe.plataformacontenidos.engagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pe.plataformacontenidos.TestcontainersConfiguration;

/** Visitas anónimas (hoja de ruta F3): robots, repetidas e ids inexistentes no cuentan. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ContentViewIntegrationTest {

    private static final String BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ContentViewCounter counter;

    @Autowired
    private ContentViewFlushJob flushJob;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private StringRedisTemplate redis;

    @BeforeEach
    void cleanPending() {
        redis.delete(ContentViewCounter.PENDING_KEY);
        redis.delete(ContentViewFlushJob.FLUSHING_KEY);
    }

    @Test
    void anonymousEndpointAlwaysAnswersNoContent() throws Exception {
        mockMvc.perform(post("/api/v1/views").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.USER_AGENT, BROWSER)
                        .content("{\"type\":\"GALLERY\",\"id\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void invalidTypeIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/views").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"NOPE\",\"id\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void countsOncePerVisitorAndIgnoresBots() {
        UUID gallery = publishedGallery();

        assertThat(counter.record(ContentType.GALLERY, gallery, "203.0.113.7", BROWSER)).isTrue();
        assertThat(counter.record(ContentType.GALLERY, gallery, "203.0.113.7", BROWSER)).as("recarga").isFalse();
        assertThat(counter.record(ContentType.GALLERY, gallery, "203.0.113.8", BROWSER)).isTrue();
        assertThat(counter.record(ContentType.GALLERY, gallery, "203.0.113.9", "Googlebot/2.1")).isFalse();

        flushJob.flush();

        assertThat(views(gallery)).isEqualTo(2L);
        assertThat(redis.hasKey(ContentViewFlushJob.FLUSHING_KEY)).isFalse();
    }

    @Test
    void flushAddsToTheSameDayAndDropsUnknownContent() {
        UUID gallery = publishedGallery();
        UUID unknown = UUID.randomUUID();

        counter.record(ContentType.GALLERY, gallery, "198.51.100.1", BROWSER);
        counter.record(ContentType.GALLERY, unknown, "198.51.100.1", BROWSER);
        flushJob.flush();
        counter.record(ContentType.GALLERY, gallery, "198.51.100.2", BROWSER);
        flushJob.flush();

        assertThat(views(gallery)).isEqualTo(2L);
        assertThat(views(unknown)).isZero();
    }

    private UUID publishedGallery() {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO galleries.galleries (id, slug, title, status, author_id, category_id, published_at)
                VALUES (?, ?, 'Galería visitas', 'PUBLISHED', ?, ?, now())
                """, id, "galeria-visitas-" + id, UUID.randomUUID(), UUID.randomUUID());
        return id;
    }

    private long views(UUID contentId) {
        Long total = jdbc.queryForObject(
                "SELECT COALESCE(SUM(views), 0) FROM engagement.content_views_daily WHERE content_id = ?",
                Long.class, contentId);
        return total == null ? 0 : total;
    }
}
