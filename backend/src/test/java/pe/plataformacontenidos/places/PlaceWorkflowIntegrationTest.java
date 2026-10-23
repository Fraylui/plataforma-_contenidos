package pe.plataformacontenidos.places;

import pe.plataformacontenidos.identity.internal.WorkerPermissionRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.permission.TestProfile;
import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** CONTEXTO.md sección 6: Lugares, con el mismo flujo de publicación que Content (sección 12). */
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
    private WorkerPermissionRepository workerPermissions;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void fullContentLifecycleFromDraftToPublished() throws Exception {
        String publisherToken = createUserAndLogin("places-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("places-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Lugares Turísticos Test");

        String placeId = createDraftPlace(creatorToken, categoryId, "Pampa de la Quinua");

        // No visible públicamente en DRAFT
        mockMvc.perform(get("/api/v1/places/pampa-de-la-quinua")).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/v1/places/pampa-de-la-quinua"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pampa de la Quinua"))
                .andExpect(jsonPath("$.latitude").value(-13.04));

        mockMvc.perform(get("/api/v1/places").param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'pampa-de-la-quinua')]").exists());

        // Archivar lo retira de la vista pública
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/archive")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/v1/places/pampa-de-la-quinua")).andExpect(status().isNotFound());
    }

    @Test
    void rejectsUnknownImageIdInGallery() throws Exception {
        String creatorToken = createUserAndLogin("places-creador-2@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String publisherToken = createUserAndLogin("places-publicador-2@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(publisherToken, "Categoría Imagen Test");

        mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Lugar con imagen inexistente\",\"body\":\"Historia del lugar.\","
                                + "\"categoryId\":\"" + categoryId + "\","
                                + "\"images\":[{\"imageId\":\"00000000-0000-0000-0000-000000000000\"}]}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void teammateCanPublishSomeoneElsesPlace() throws Exception {
        String publisherToken = createUserAndLogin("places-publicador-3@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("places-creador-3@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String otherCreatorToken = createUserAndLogin("places-creador-4@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Categoría Ajena Test");

        String placeId = createDraftPlace(creatorToken, categoryId, "Mirador secreto");

        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/publish")
                        .header("Authorization", "Bearer " + otherCreatorToken))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsInvalidCoordinates() throws Exception {
        String creatorToken = createUserAndLogin("places-creador-5@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String publisherToken = createUserAndLogin("places-publicador-5@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(publisherToken, "Categoría Coordenadas Test");

        mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Lugar con coordenadas inválidas\",\"body\":\"Historia.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"latitude\":200,\"longitude\":0}"))
                .andExpect(status().isBadRequest());
    }

    private String createDraftPlace(String creatorToken, String categoryId, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Historia completa del lugar, con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"latitude\":-13.04,\"longitude\":-74.15}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();
        return textField(result, "id");
    }

    private String createCategory(String publisherToken, String name) throws Exception {
        // Sufijo único: la BD de Testcontainers se comparte entre clases de test y el nombre de categoría es único (ignore-case).
        name = name + " " + UUID.randomUUID().toString().substring(0, 8);
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + publisherToken)
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

    private String createUserAndLogin(String email, TestProfile role) throws Exception {
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role.toRole()));
        role.grant(workerPermissions, created.getId());
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return textField(result, "accessToken");
    }
}
