package pe.plataformacontenidos.search;

import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.permission.TestProfile;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * CONTEXTO.md sección 16: búsqueda de texto completo, unificada sobre
 * Artículos (V12__article_search.sql) y Lugares (V15__place_search.sql) —
 * antes solo cubría Artículos.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class SearchIntegrationTest {

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
    void findsPublishedPublicationByTitleWordAndNotUnrelatedMatches() throws Exception {
        String publisherToken = createUserAndLogin("search-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("search-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Turismo Búsqueda Test");

        // Palabra distintiva (no "turismo"/"andino" sueltos: la suite completa
        // comparte una sola base entre clases de test, y esas son demasiado
        // comunes en otros fixtures — daría falsos positivos de tamaño exacto).
        publishPublication(creatorToken, publisherToken, categoryId,
                "Quinua, Ayacucho: historia y kimsapampatur andino",
                "Un recorrido por la plaza y la iglesia colonial de Quinua.");
        publishPublication(creatorToken, publisherToken, categoryId,
                "Receta tradicional de puca picante",
                "Un plato típico ayacuchano, sin relación con lo anterior.");

        mockMvc.perform(get("/api/v1/search").param("q", "kimsapampatur"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.items[0].title").value("Quinua, Ayacucho: historia y kimsapampatur andino"))
                .andExpect(jsonPath("$.items[0].contentType").value("PUBLICATION"));
    }

    @Test
    void findsPublishedPlace() throws Exception {
        String publisherToken = createUserAndLogin("search-place-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("search-place-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Categoría Lugar Búsqueda Test");

        String placeId = createPlace(creatorToken, categoryId, "Templo colonial de Huamanguilla");
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/search").param("q", "Huamanguilla"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].title").value("Templo colonial de Huamanguilla"))
                .andExpect(jsonPath("$.items[0].contentType").value("PLACE"));
    }

    @Test
    void typeParamFiltersOutTheOtherContentTypeEvenIfItMatches() throws Exception {
        String publisherToken = createUserAndLogin("search-type-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("search-type-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Categoría Filtro Tipo Test");

        // Misma palabra distintiva en un artículo y en un lugar, para probar
        // que el filtro type= de verdad excluye al otro tipo (y no que
        // simplemente no había resultados del otro tipo para empezar).
        publishPublication(creatorToken, publisherToken, categoryId,
                "Wamanripa: guía completa", "Todo sobre wamanripa en la región.");
        String placeId = createPlace(creatorToken, categoryId, "Mirador Wamanripa");
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/search").param("q", "Wamanripa").param("type", "PLACE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].contentType", org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("PLACE"))))
                .andExpect(jsonPath("$.items[*].title", org.hamcrest.Matchers.hasItem("Mirador Wamanripa")));

        mockMvc.perform(get("/api/v1/search").param("q", "Wamanripa").param("type", "PUBLICATION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].contentType", org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("PUBLICATION"))))
                .andExpect(jsonPath("$.items[*].title", org.hamcrest.Matchers.hasItem("Wamanripa: guía completa")));
    }

    @Test
    void findsPublishedEvent() throws Exception {
        String publisherToken = createUserAndLogin("search-event-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("search-event-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Categoría Evento Búsqueda Test");

        String eventId = createEvent(creatorToken, categoryId, "Festival Puyllay de Quinua");
        mockMvc.perform(post("/api/v1/admin/events/" + eventId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/search").param("q", "Puyllay").param("type", "EVENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].title").value("Festival Puyllay de Quinua"))
                .andExpect(jsonPath("$.items[0].contentType").value("EVENT"));
    }

    @Test
    void findsPublishedGallery() throws Exception {
        String publisherToken = createUserAndLogin("search-gallery-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("search-gallery-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Categoría Galería Búsqueda Test");
        String imageId = uploadImage(creatorToken);

        String galleryId = createGallery(creatorToken, categoryId, "Carnaval de Ayacucho en fotos", imageId);
        mockMvc.perform(post("/api/v1/admin/galleries/" + galleryId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/search").param("q", "Carnaval").param("type", "GALLERY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].title").value("Carnaval de Ayacucho en fotos"))
                .andExpect(jsonPath("$.items[0].contentType").value("GALLERY"));
    }

    @Test
    void doesNotReturnDraftPublications() throws Exception {
        String creatorToken = createUserAndLogin("search-creador-2@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String publisherToken = createUserAndLogin("search-publicador-2@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(publisherToken, "Categoría Draft Test");

        mockMvc.perform(post("/api/v1/admin/publications")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(publicationJson(categoryId, "Borrador exclusivo sobre criptomonedas")))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/search").param("q", "criptomonedas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void blankQueryReturnsEmptyPageInsteadOfError() throws Exception {
        mockMvc.perform(get("/api/v1/search").param("q", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void findsContentByItsCategoryNameEvenIfTheTextNeverMentionsIt() throws Exception {
        String publisherToken = createUserAndLogin("search-cat-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("search-cat-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        // Nombre con tilde: la búsqueda debe encontrarlo escrito sin tilde y en minúsculas.
        String categoryId = createCategory(publisherToken, "Kunturwási Temático");

        publishPublication(creatorToken, publisherToken, categoryId, "Paseo por la plaza al atardecer",
                "Un recorrido tranquilo, sin nombrar el tema en ningún lado.");
        publishPlaceInCategory(creatorToken, publisherToken, categoryId, "Mirador del cerro alto");

        mockMvc.perform(get("/api/v1/search").param("q", "kunturwasi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].title", hasItem("Paseo por la plaza al atardecer")))
                .andExpect(jsonPath("$.items[*].title", hasItem("Mirador del cerro alto")));

        mockMvc.perform(get("/api/v1/search").param("q", "kunturwasi").param("type", "PLACE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].contentType", everyItem(is("PLACE"))))
                .andExpect(jsonPath("$.items[*].title", hasItem("Mirador del cerro alto")));
    }

    @Test
    void contentMatchingByTextAndByCategoryAppearsOnlyOnce() throws Exception {
        String publisherToken = createUserAndLogin("search-dup-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("search-dup-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Wiñaypachaq");

        publishPublication(creatorToken, publisherToken, categoryId, "Guía de Wiñaypachaq para principiantes",
                "Todo sobre wiñaypachaq.");

        mockMvc.perform(get("/api/v1/search").param("q", "wiñaypachaq"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.title == 'Guía de Wiñaypachaq para principiantes')]", hasSize(1)));
    }

    private void publishPlaceInCategory(String creatorToken, String publisherToken, String categoryId, String name)
            throws Exception {
        String placeId = createPlace(creatorToken, categoryId, name);
        mockMvc.perform(post("/api/v1/admin/places/" + placeId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());
    }

    private void publishPublication(String creatorToken, String publisherToken, String categoryId, String title,
            String body) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/publications")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(publicationJsonWithBody(categoryId, title, body)))
                .andExpect(status().isCreated())
                .andReturn();
        String publicationId = textField(result, "id");

        mockMvc.perform(post("/api/v1/admin/publications/" + publicationId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());
    }

    private String createPlace(String creatorToken, String categoryId, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Historia del lugar con suficiente contenido para el índice.\","
                                + "\"categoryId\":\"" + categoryId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String createEvent(String creatorToken, String categoryId, String title) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Descripción del evento con suficiente contenido para el índice.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"2030-06-14T19:00:00Z\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String uploadImage(String creatorToken) throws Exception {
        BufferedImage image = new BufferedImage(40, 30, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        MockMultipartFile file = new MockMultipartFile("file", "search-test.png", "image/png", out.toByteArray());
        MvcResult result = mockMvc.perform(multipart("/api/v1/admin/images").file(file)
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String createGallery(String creatorToken, String categoryId, String title, String imageId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/galleries")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"categoryId\":\"" + categoryId + "\",\"images\":[{\"imageId\":\"" + imageId + "\"}]}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String publicationJsonWithBody(String categoryId, String title, String body) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"excerpt\":\"Resumen breve\","
                + "\"body\":\"" + body + "\","
                + "\"publicationType\":\"GENERAL\","
                + "\"categoryId\":\"" + categoryId + "\""
                + "}";
    }

    private String publicationJson(String categoryId, String title) {
        return publicationJsonWithBody(categoryId, title, "Cuerpo completo del artículo con suficiente contenido.");
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
