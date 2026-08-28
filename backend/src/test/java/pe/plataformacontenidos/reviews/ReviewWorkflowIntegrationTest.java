package pe.plataformacontenidos.reviews;

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

/** Reseñas, con el mismo flujo editorial que Article/Places/Events/Galleries (sección 12). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ReviewWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void fullEditorialLifecycleFromDraftToPublishedWithLinkedPlace() throws Exception {
        String editorToken = createUserAndLogin("reviews-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("reviews-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Reseñas Gastronómicas Test");
        String placeId = createAndPublishPlace(authorToken, editorToken, categoryId, "Restaurante Wamanripa");

        String reviewId = createDraftReview(authorToken, categoryId, "Excelente puca picante", placeId, null, 5);

        // No visible públicamente en DRAFT
        mockMvc.perform(get("/api/v1/reviews/excelente-puca-picante")).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/reviews/" + reviewId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));

        // El autor no puede aprobar su propia reseña
        mockMvc.perform(post("/api/v1/admin/reviews/" + reviewId + "/approve")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/admin/reviews/" + reviewId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(post("/api/v1/admin/reviews/" + reviewId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/v1/reviews/excelente-puca-picante"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Excelente puca picante"))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.placeId").value(placeId));

        mockMvc.perform(get("/api/v1/reviews").param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'excelente-puca-picante')]").exists());

        // Archivar lo retira de la vista pública
        mockMvc.perform(post("/api/v1/admin/reviews/" + reviewId + "/archive")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/v1/reviews/excelente-puca-picante")).andExpect(status().isNotFound());
    }

    @Test
    void createsReviewWithFreeTextSubjectWhenNoPlaceExists() throws Exception {
        String authorToken = createUserAndLogin("reviews-author-2@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("reviews-editor-2@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Sujeto Libre Test");

        String reviewId = createDraftReview(authorToken, categoryId, "Buena pension familiar", null,
                "Pension Dona Rosa", 4);

        mockMvc.perform(get("/api/v1/admin/reviews/" + reviewId)
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subjectName").value("Pension Dona Rosa"))
                .andExpect(jsonPath("$.placeId").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void rejectsRatingOutsideOneToFive() throws Exception {
        String authorToken = createUserAndLogin("reviews-author-3@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("reviews-editor-3@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Rating Invalido Test");

        mockMvc.perform(post("/api/v1/admin/reviews")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Calificacion invalida\",\"body\":\"Descripcion.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"rating\":7}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsUnknownPlaceId() throws Exception {
        String authorToken = createUserAndLogin("reviews-author-4@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("reviews-editor-4@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Lugar Inexistente Test");

        mockMvc.perform(post("/api/v1/admin/reviews")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Resena de lugar inexistente\",\"body\":\"Descripcion.\","
                                + "\"categoryId\":\"" + categoryId + "\","
                                + "\"placeId\":\"00000000-0000-0000-0000-000000000000\",\"rating\":3}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void authorCannotEditSomeoneElsesReview() throws Exception {
        String editorToken = createUserAndLogin("reviews-editor-5@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("reviews-author-5@plataforma-contenidos.test", Role.AUTHOR);
        String otherAuthorToken = createUserAndLogin("reviews-author-6@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Categoría Reseña Ajena Test");

        String reviewId = createDraftReview(authorToken, categoryId, "Opinion privada", null, "Lugar cualquiera", 3);

        mockMvc.perform(post("/api/v1/admin/reviews/" + reviewId + "/submit")
                        .header("Authorization", "Bearer " + otherAuthorToken))
                .andExpect(status().isForbidden());
    }

    private String createAndPublishPlace(String authorToken, String editorToken, String categoryId, String name)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"body\":\"Historia del lugar con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String placeId = textField(result, "id");
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        return placeId;
    }

    private String createDraftReview(String authorToken, String categoryId, String title, String placeId,
            String subjectName, int rating) throws Exception {
        String placeField = placeId == null ? "" : ",\"placeId\":\"" + placeId + "\"";
        String subjectField = subjectName == null ? "" : ",\"subjectName\":\"" + subjectName + "\"";
        MvcResult result = mockMvc.perform(post("/api/v1/admin/reviews")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Descripcion completa de la resena, con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"rating\":" + rating + placeField
                                + subjectField + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
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
