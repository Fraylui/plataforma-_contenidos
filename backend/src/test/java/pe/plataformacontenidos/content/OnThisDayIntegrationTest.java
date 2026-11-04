package pe.plataformacontenidos.content;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** "Un día como hoy" (CONTEXTO.md 1.1): fecha memorable opcional y su listado público. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class OnThisDayIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void listaLoPublicadoDeHoyYLosProximosDias() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String authorToken = createUserAndLogin("otd-author-" + suffix + "@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("otd-editor-" + suffix + "@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Historia OTD");

        // Fecha poco común para no chocar con datos de otras clases de test (BD compartida).
        String batalla = publish(authorToken, editorToken, categoryId, "Batalla de prueba " + suffix,
                ",\"memorableDay\":17,\"memorableMonth\":7,\"memorableYear\":1824");
        String fiesta = publish(authorToken, editorToken, categoryId, "Fiesta de prueba " + suffix,
                ",\"memorableDay\":19,\"memorableMonth\":7");
        publish(authorToken, editorToken, categoryId, "Sin fecha " + suffix, "");

        mockMvc.perform(get("/api/v1/articles/on-this-day").param("date", "2026-07-17").param("days", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.article.id == '" + batalla + "')].daysUntil").value(0))
                .andExpect(jsonPath("$[?(@.article.id == '" + batalla + "')].yearsAgo").value(202))
                .andExpect(jsonPath("$[?(@.article.id == '" + fiesta + "')].daysUntil").value(2))
                .andExpect(jsonPath("$[?(@.article.title == 'Sin fecha " + suffix + "')]").doesNotExist());

        // Fuera de la ventana no aparece.
        mockMvc.perform(get("/api/v1/articles/on-this-day").param("date", "2026-07-18").param("days", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.article.id == '" + batalla + "')]").doesNotExist());

        // El detalle devuelve la fecha para mostrarla y editarla.
        mockMvc.perform(get("/api/v1/admin/articles/" + batalla).header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memorableDay").value(17))
                .andExpect(jsonPath("$.memorableMonth").value(7))
                .andExpect(jsonPath("$.memorableYear").value(1824));
    }

    @Test
    void rechazaFechasInvalidas() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String authorToken = createUserAndLogin("otd-bad-author-" + suffix + "@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("otd-bad-editor-" + suffix + "@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Historia OTD inválida");

        for (String extra : new String[] {
                ",\"memorableDay\":30,\"memorableMonth\":2",
                ",\"memorableDay\":9",
                ",\"memorableYear\":1824"}) {
            mockMvc.perform(post("/api/v1/admin/articles")
                            .header("Authorization", "Bearer " + authorToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(articleJson("Fecha inválida " + suffix, categoryId, extra)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void editarPuedeQuitarLaFecha() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String authorToken = createUserAndLogin("otd-edit-author-" + suffix + "@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("otd-edit-editor-" + suffix + "@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Historia OTD edición");

        String id = textField(mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson("Editable " + suffix, categoryId, ",\"memorableDay\":1,\"memorableMonth\":5")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.memorableDay").value(1))
                .andReturn(), "id");

        mockMvc.perform(put("/api/v1/admin/articles/" + id)
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson("Editable " + suffix, categoryId, "")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memorableDay").value(nullValue()));
    }

    private String publish(String authorToken, String editorToken, String categoryId, String title, String extra)
            throws Exception {
        String id = textField(mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(title, categoryId, extra)))
                .andExpect(status().isCreated())
                .andReturn(), "id");
        mockMvc.perform(post("/api/v1/admin/articles/" + id + "/submit").header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + id + "/approve").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + id + "/publish").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        return id;
    }

    private static String articleJson(String title, String categoryId, String extra) {
        return "{\"title\":\"" + title + "\","
                + "\"body\":\"Cuerpo completo del contenido con suficiente texto.\","
                + "\"articleType\":\"HISTORIA\","
                + "\"categoryId\":\"" + categoryId + "\"" + extra + "}";
    }

    private String createCategory(String editorToken, String name) throws Exception {
        name = name + " " + UUID.randomUUID().toString().substring(0, 8);
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String textField(MvcResult result, String field) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get(field).asText();
    }

    private String createUserAndLogin(String email, Role role) throws Exception {
        String password = "SomeStrongPassword123!";
        userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role));
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return textField(result, "accessToken");
    }
}
