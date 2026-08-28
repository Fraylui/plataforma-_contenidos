package pe.plataformacontenidos.directory;

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

/** Directorio (empresas/negocios), con el mismo flujo editorial que Article/Places/Reviews (sección 12). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class BusinessWorkflowIntegrationTest {

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
        String editorToken = createUserAndLogin("directory-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("directory-author@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Directorio Gastronómico Test");
        String placeId = createAndPublishPlace(authorToken, editorToken, categoryId, "Plaza Mayor de Huamanga");

        String businessId = createDraftBusiness(authorToken, categoryId, "Restaurante Wamanripa", "RESTAURANT",
                placeId, null);

        // No visible públicamente en DRAFT
        mockMvc.perform(get("/api/v1/directory/restaurante-wamanripa")).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/directory/" + businessId + "/submit")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));

        // El autor no puede aprobar su propia ficha
        mockMvc.perform(post("/api/v1/admin/directory/" + businessId + "/approve")
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/admin/directory/" + businessId + "/approve")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(post("/api/v1/admin/directory/" + businessId + "/publish")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/v1/directory/restaurante-wamanripa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Restaurante Wamanripa"))
                .andExpect(jsonPath("$.businessType").value("RESTAURANT"))
                .andExpect(jsonPath("$.placeId").value(placeId));

        mockMvc.perform(get("/api/v1/directory").param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'restaurante-wamanripa')]").exists());

        mockMvc.perform(get("/api/v1/directory").param("businessType", "RESTAURANT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'restaurante-wamanripa')]").exists());
        mockMvc.perform(get("/api/v1/directory").param("businessType", "HOTEL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'restaurante-wamanripa')]").doesNotExist());

        // Archivar lo retira de la vista pública
        mockMvc.perform(post("/api/v1/admin/directory/" + businessId + "/archive")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/v1/directory/restaurante-wamanripa")).andExpect(status().isNotFound());
    }

    @Test
    void createsBusinessWithFreeTextAddressWhenNoPlaceExists() throws Exception {
        String authorToken = createUserAndLogin("directory-author-2@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("directory-editor-2@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Dirección Libre Test");

        String businessId = createDraftBusiness(authorToken, categoryId, "Hostal Los Andes", "HOTEL", null,
                "Jr. Lima 123, Huamanga");

        mockMvc.perform(get("/api/v1/admin/directory/" + businessId)
                        .header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("Jr. Lima 123, Huamanga"))
                .andExpect(jsonPath("$.placeId").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void rejectsMissingBusinessType() throws Exception {
        String authorToken = createUserAndLogin("directory-author-3@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("directory-editor-3@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Sin Tipo Test");

        mockMvc.perform(post("/api/v1/admin/directory")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Sin tipo\",\"body\":\"Descripcion.\","
                                + "\"categoryId\":\"" + categoryId + "\"}"))
                .andExpect(status().isBadRequest());
    }

    /** Regresión del hallazgo de la auditoría (2026-08-27): faltaban límites de rango en latitud/longitud. */
    @Test
    void rejectsCoordinatesOutOfRange() throws Exception {
        String authorToken = createUserAndLogin("directory-author-4@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("directory-editor-4@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Coordenadas Test");

        mockMvc.perform(post("/api/v1/admin/directory")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Coordenadas invalidas\",\"body\":\"Descripcion.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"businessType\":\"SHOP\","
                                + "\"latitude\":500,\"longitude\":0}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsUnknownPlaceId() throws Exception {
        String authorToken = createUserAndLogin("directory-author-5@plataforma-contenidos.test", Role.AUTHOR);
        String editorToken = createUserAndLogin("directory-editor-5@plataforma-contenidos.test", Role.EDITOR);
        String categoryId = createCategory(editorToken, "Categoría Lugar Inexistente Test");

        mockMvc.perform(post("/api/v1/admin/directory")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Negocio en lugar inexistente\",\"body\":\"Descripcion.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"businessType\":\"SERVICE\","
                                + "\"placeId\":\"00000000-0000-0000-0000-000000000000\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void authorCannotEditSomeoneElsesBusiness() throws Exception {
        String editorToken = createUserAndLogin("directory-editor-6@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("directory-author-6@plataforma-contenidos.test", Role.AUTHOR);
        String otherAuthorToken = createUserAndLogin("directory-author-7@plataforma-contenidos.test", Role.AUTHOR);
        String categoryId = createCategory(editorToken, "Categoría Ficha Ajena Test");

        String businessId = createDraftBusiness(authorToken, categoryId, "Tienda cualquiera", "SHOP", null,
                "Sin dirección todavía");

        mockMvc.perform(post("/api/v1/admin/directory/" + businessId + "/submit")
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

    private String createDraftBusiness(String authorToken, String categoryId, String name, String businessType,
            String placeId, String address) throws Exception {
        String placeField = placeId == null ? "" : ",\"placeId\":\"" + placeId + "\"";
        String addressField = address == null ? "" : ",\"address\":\"" + address + "\"";
        MvcResult result = mockMvc.perform(post("/api/v1/admin/directory")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Descripcion completa del negocio, con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"businessType\":\"" + businessType + "\""
                                + placeField + addressField + "}"))
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
