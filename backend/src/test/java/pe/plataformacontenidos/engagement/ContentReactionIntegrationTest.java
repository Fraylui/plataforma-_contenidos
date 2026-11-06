package pe.plataformacontenidos.engagement;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.catalog.ContentType;

/** Reacciones anónimas: una por visitante, se cambia o se quita, solo en lo publicado. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ContentReactionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private ContentEngagementService engagement;

    @Autowired
    private ContentReactionService reactionService;

    private long likes(UUID contentId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM engagement.content_likes WHERE content_id = ?", Long.class, contentId);
    }

    @Test
    void oneReactionPerVisitorThatCanChangeOrBeRemoved() throws Exception {
        UUID gallery = gallery("PUBLISHED");
        UUID ana = UUID.randomUUID();
        UUID beto = UUID.randomUUID();

        react(gallery, ana, "\"LOVE\"").andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.LOVE").value(1)).andExpect(jsonPath("$.mine").value("LOVE"));
        react(gallery, beto, "\"LOVE\"").andExpect(jsonPath("$.counts.LOVE").value(2));
        // Doble toque: no duplica.
        react(gallery, beto, "\"LOVE\"").andExpect(jsonPath("$.counts.LOVE").value(2));
        // Cambiar de reacción mueve el conteo.
        react(gallery, ana, "\"WOW\"").andExpect(jsonPath("$.counts.LOVE").value(1))
                .andExpect(jsonPath("$.counts.WOW").value(1)).andExpect(jsonPath("$.mine").value("WOW"));
        // Quitar.
        react(gallery, ana, "null").andExpect(jsonPath("$.counts.WOW").value(0))
                .andExpect(jsonPath("$.mine").doesNotExist());

        mockMvc.perform(get("/api/v1/reactions?type=GALLERY&id=" + gallery + "&visitorId=" + beto))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.LOVE").value(1))
                .andExpect(jsonPath("$.counts.FUNNY").value(0))
                .andExpect(jsonPath("$.mine").value("LOVE"));
    }

    /** «Me encanta» y el «me gusta» del corazón son lo mismo: una sola reacción por visitante. */
    @Test
    void loveIsTheLikeAndOnlyOneReactionPerVisitor() throws Exception {
        UUID gallery = gallery("PUBLISHED");
        String slug = "galeria-reacciones-" + gallery;
        UUID ana = UUID.randomUUID();

        // ❤️ por reacciones = un me gusta.
        react(gallery, ana, "\"LOVE\"").andExpect(jsonPath("$.counts.LOVE").value(1));
        org.assertj.core.api.Assertions.assertThat(likes(gallery)).isEqualTo(1);

        // Cambiar a otra reacción quita el me gusta.
        react(gallery, ana, "\"FUNNY\"").andExpect(jsonPath("$.counts.LOVE").value(0))
                .andExpect(jsonPath("$.counts.FUNNY").value(1));
        org.assertj.core.api.Assertions.assertThat(likes(gallery)).isZero();

        // Dar me gusta con el corazón quita la otra reacción.
        mockMvc.perform(post("/api/v1/galleries/" + slug + "/like?visitorId=" + ana))
                .andExpect(status().isOk()).andExpect(jsonPath("$.liked").value(true));
        mockMvc.perform(get("/api/v1/reactions?type=GALLERY&id=" + gallery + "&visitorId=" + ana))
                .andExpect(jsonPath("$.counts.LOVE").value(1))
                .andExpect(jsonPath("$.counts.FUNNY").value(0))
                .andExpect(jsonPath("$.mine").value("LOVE"));
        org.assertj.core.api.Assertions.assertThat(reactionService.countsOf(Reaction.LOVE)).containsEntry(gallery, 1L);
        org.assertj.core.api.Assertions.assertThat(reactionService.countsFor(java.util.List.of(gallery)).get(gallery))
                .containsEntry(Reaction.LOVE, 1L);
    }

    @Test
    void onlyPublishedContentAndValidRequests() throws Exception {
        UUID draft = gallery("DRAFT");
        react(draft, UUID.randomUUID(), "\"LOVE\"").andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/reactions?type=GALLERY&id=" + draft)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/reactions?type=STORY&id=" + draft)).andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/reactions").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"GALLERY\",\"id\":\"" + draft + "\",\"visitorId\":\"" + UUID.randomUUID()
                                + "\",\"reaction\":\"ENOJO\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/reactions").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"GALLERY\",\"id\":\"" + draft + "\",\"reaction\":\"LOVE\"}"))
                .andExpect(status().isBadRequest());
    }

    /** El panel ve reacciones y clics de afiliado por fila, junto a visitas y me gusta. */
    @Test
    void adminListCountsIncludeReactionsAndAffiliateClicks() throws Exception {
        UUID place = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO places.places (id, slug, name, body, status, author_id, category_id, published_at)
                VALUES (?, ?, 'Lugar cifras', '<p>Texto</p>', 'PUBLISHED', ?, ?, now())
                """, place, "lugar-cifras-" + place, UUID.randomUUID(), UUID.randomUUID());
        for (String reaction : new String[] { "\"LOVE\"", "\"WOW\"" }) {
            mockMvc.perform(post("/api/v1/reactions").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"type\":\"PLACE\",\"id\":\"" + place + "\",\"visitorId\":\"" + UUID.randomUUID()
                            + "\",\"reaction\":" + reaction + "}"))
                    .andExpect(status().isOk());
        }
        jdbc.update("""
                INSERT INTO affiliates.affiliate_links (content_type, content_id, position, label, url, clicks)
                VALUES ('PLACE', ?, 0, 'Tour', 'https://civitatis.com/a', 7), ('PLACE', ?, 1, 'Hotel', 'https://booking.com/b', 3)
                """, place, place);

        ContentEngagementService.Counts counts = engagement.countsFor(ContentType.PLACE, java.util.List.of(place)).get(place);

        // «Me encanta» cuenta como me gusta; «reacciones» son las otras tres.
        org.assertj.core.api.Assertions.assertThat(counts.likes()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(counts.reactions()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(counts.affiliateClicks()).isEqualTo(10);
    }

    private org.springframework.test.web.servlet.ResultActions react(UUID gallery, UUID visitor, String reaction) throws Exception {
        return mockMvc.perform(post("/api/v1/reactions").contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"GALLERY\",\"id\":\"" + gallery + "\",\"visitorId\":\"" + visitor + "\",\"reaction\":"
                        + reaction + "}"));
    }

    private UUID gallery(String status) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO galleries.galleries (id, slug, title, status, author_id, category_id, published_at)
                VALUES (?, ?, 'Galería reacciones', ?, ?, ?, CASE WHEN ?::text = 'PUBLISHED' THEN now() END)
                """, id, "galeria-reacciones-" + id, status, UUID.randomUUID(), UUID.randomUUID(), status);
        return id;
    }
}
