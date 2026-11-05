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
