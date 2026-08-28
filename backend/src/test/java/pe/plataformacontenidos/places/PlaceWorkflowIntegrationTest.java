package pe.plataformacontenidos.places;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

/** CONTEXTO.md sección 6: Lugares, con el mismo flujo editorial que Content (sección 12). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class PlaceWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void fullEditorialLifecycleFromDraftToPublishedWithRelatedArticles() throws Exception {
        String editorToken = createUserAndLogin("places-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("places-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Lugares Turísticos Test");
        String peruId = createGeographyUnit(editorToken, "Perú Places Test", "PAIS", null);
        String ayacuchoId = createGeographyUnit(editorToken, "Ayacucho Places Test", "REGION", peruId);

        // Artículo publicado en la misma ubicación, para verificar "artículos relacionados"
        String articleId = createAndPublishArticle(editorToken, authorToken, categoryId, ayacuchoId,
                "Crónica de la región andina");

        String placeId = createDraftPlace(authorToken, categoryId, ayacuchoId, "Pampa de la Quinua");

        // No visible públicamente en DRAFT
        mockMvc.perform(get("/api/v1/places/pampa-de-la-quinua")).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));

        // El autor no puede aprobar su propio lugar
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/approve")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/v1/places/pampa-de-la-quinua"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pampa de la Quinua"))
                .andExpect(jsonPath("$.latitude").value(-13.04))
                .andExpect(jsonPath("$.relatedArticles[?(@.id == '" + articleId + "')]").exists());

        mockMvc.perform(get("/api/v1/places").param("geographyId", ayacuchoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'pampa-de-la-quinua')]").exists());

        // Archivar lo retira de la vista pública
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/archive")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/v1/places/pampa-de-la-quinua")).andExpect(status().isNotFound());
    }

    @Test
    void rejectsUnknownImageIdInGallery() throws Exception {
        String authorToken = createUserAndLogin("places-author-2@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("places-editor-2@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Imagen Test");

        mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Lugar con imagen inexistente\",\"body\":\"Historia del lugar.\","
                                + "\"categoryId\":\"" + categoryId + "\","
                                + "\"imageIds\":[\"00000000-0000-0000-0000-000000000000\"]}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void authorCannotEditSomeoneElsesPlace() throws Exception {
        String editorToken = createUserAndLogin("places-editor-3@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("places-author-3@plataforma-contenidos.test", Role.AUTHOR);
        String otherAuthorToken = createUserAndLogin("places-author-4@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Categoría Ajena Test");

        String placeId = createDraftPlace(authorToken, categoryId, null, "Mirador secreto");

        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/submit")
                        .header("Authorization", "Bearer " + otherAuthorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsInvalidCoordinates() throws Exception {
        String authorToken = createUserAndLogin("places-author-5@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("places-editor-5@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Coordenadas Test");

        mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Lugar con coordenadas inválidas\",\"body\":\"Historia.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"latitude\":200,\"longitude\":0}"))
                .andExpect(status().isBadRequest());
    }

    private String createAndPublishArticle(String editorToken, String authorToken, String categoryId,
            String geographyId, String title) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen\","
                                + "\"body\":\"Cuerpo suficientemente largo del artículo.\",\"articleType\":\"ARTICULO\","
                                + "\"categoryId\":\"" + categoryId + "\",\"geographyId\":\"" + geographyId + "\","
                                + "\"tagNames\":[]}"))
                .andExpect(status().isCreated())
                .andReturn();
        String articleId = textField(result, "id");
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/articles/" + articleId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        return articleId;
    }

    private String createDraftPlace(String authorToken, String categoryId, String geographyId, String name)
            throws Exception {
        String geographyField = geographyId == null ? "" : ",\"geographyId\":\"" + geographyId + "\"";
        MvcResult result = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Historia completa del lugar, con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"latitude\":-13.04,\"longitude\":-74.15"
                                + geographyField + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();
        return textField(result, "id");
    }

    private String createGeographyUnit(String editorToken, String name, String level, String parentId)
            throws Exception {
        String parentField = parentId == null ? "" : ",\"parentId\":\"" + parentId + "\"";
        MvcResult result = mockMvc.perform(post("/api/v1/admin/geography")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"level\":\"" + level + "\"" + parentField + "}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String createCategory(String editorToken, String name) throws Exception {
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
