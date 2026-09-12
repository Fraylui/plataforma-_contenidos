package pe.plataformacontenidos.security;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;
import pe.plataformacontenidos.TestcontainersConfiguration;

/**
 * Test de seguridad de entrada (OWASP A03 Injection, A05 Misconfiguration):
 * la API pública debe tratar entradas hostiles o malformadas como datos,
 * responder 4xx (nunca 500) y no filtrar detalles internos (stack traces,
 * SQL, nombres de clase) en el cuerpo de error.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ApiHardeningIntegrationTest {

    private static final String[] PUBLIC_COLLECTIONS = {"articles", "places", "events", "galleries", "reviews", "directory"};

    @Autowired private MockMvc mockMvc;

    static Stream<String> hostileSearchTerms() {
        return Stream.of(
                "' OR 1=1 --",
                "\"; DROP TABLE articles; --",
                "<script>alert(1)</script>",
                "%00null",
                "a".repeat(2000),
                "🔥 emoji 東京",
                "a & b | c ! :* (tsquery)");
    }

    static Stream<String> hostilePagination() {
        return Stream.of("page=-1", "size=0", "size=-5", "size=100000", "page=999999999", "page=abc", "size=1e9",
                "categoryId=not-a-uuid");
    }

    @ParameterizedTest(name = "búsqueda hostil: {0}")
    @MethodSource("hostileSearchTerms")
    void searchTreatsHostileInputAsData(String term) throws Exception {
        mockMvc.perform(get("/api/v1/search").param("q", term))
                .andExpect(noServerError("/api/v1/search?q=" + term))
                .andExpect(content().string(not(containsString("Exception"))))
                .andExpect(content().string(not(containsString("org.postgresql"))));
    }

    @ParameterizedTest(name = "paginación hostil: {0}")
    @MethodSource("hostilePagination")
    void publicListingsSurviveHostilePagination(String query) throws Exception {
        for (String collection : PUBLIC_COLLECTIONS) {
            String url = "/api/v1/" + collection + "?" + query;
            mockMvc.perform(get(url)).andExpect(noServerError(url));
        }
    }

    @Test
    void malformedJsonBodyIsBadRequestWithoutInternals() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"x@y.z\", \"password\": "))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(not(containsString("jackson"))))
                .andExpect(content().string(not(containsString("Exception"))));
    }

    @Test
    void wrongContentTypeOnJsonEndpointIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("email=x&password=y"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void likeEndpointRejectsInvalidVisitorId() throws Exception {
        mockMvc.perform(post("/api/v1/articles/cualquier-slug/like").param("visitorId", "not-a-uuid"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/articles/cualquier-slug/like"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void errorResponsesDoNotExposeStackTraces() throws Exception {
        mockMvc.perform(get("/api/v1/articles/este-slug-no-existe"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(not(containsString("trace"))))
                .andExpect(content().string(not(containsString("at pe.plataformacontenidos"))));
    }

    private static ResultMatcher noServerError(String description) {
        return result -> {
            int status = result.getResponse().getStatus();
            if (status >= 500) {
                throw new AssertionError(description + " devolvió " + status);
            }
        };
    }
}
