package pe.plataformacontenidos.celebrations;

import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
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
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Eventos, con el mismo flujo de publicación que Publication/Places (sección 12). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class CelebrationWorkflowIntegrationTest {

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
        String publisherToken = createUserAndLogin("celebrations-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("celebrations-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Eventos Culturales Test");

        String celebrationId = createDraftCelebration(creatorToken, categoryId, "Festival de la Wamanripa", "2030-06-14T19:00:00Z");

        // No visible públicamente en DRAFT
        mockMvc.perform(get("/api/v1/celebrations/festival-de-la-wamanripa")).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/celebrations/" + celebrationId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/v1/celebrations/festival-de-la-wamanripa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Festival de la Wamanripa"))
                .andExpect(jsonPath("$.startsAt").exists());

        mockMvc.perform(get("/api/v1/celebrations").param("categoryId", categoryId).param("when", "upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'festival-de-la-wamanripa')]").exists());

        mockMvc.perform(get("/api/v1/celebrations").param("categoryId", categoryId).param("when", "past"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'festival-de-la-wamanripa')]").doesNotExist());

        // Archivar lo retira de la vista pública
        mockMvc.perform(post("/api/v1/admin/celebrations/" + celebrationId + "/archive")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/v1/celebrations/festival-de-la-wamanripa")).andExpect(status().isNotFound());
    }

    @Test
    void separatesUpcomingFromPastCelebrations() throws Exception {
        String publisherToken = createUserAndLogin("celebrations-publicador-2@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("celebrations-creador-2@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Categoría Próximos Pasados Test");

        publishCelebration(creatorToken, publisherToken, categoryId, "Feria Kimsapampa Próxima", "2031-03-01T10:00:00Z");
        publishCelebration(creatorToken, publisherToken, categoryId, "Feria Kimsapampa Pasada", "2000-03-01T10:00:00Z");

        mockMvc.perform(get("/api/v1/celebrations").param("categoryId", categoryId).param("when", "upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'feria-kimsapampa-proxima')]").exists())
                .andExpect(jsonPath("$.items[?(@.slug == 'feria-kimsapampa-pasada')]").doesNotExist());

        mockMvc.perform(get("/api/v1/celebrations").param("categoryId", categoryId).param("when", "past"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.slug == 'feria-kimsapampa-pasada')]").exists())
                .andExpect(jsonPath("$.items[?(@.slug == 'feria-kimsapampa-proxima')]").doesNotExist());

        mockMvc.perform(get("/api/v1/celebrations/feria-kimsapampa-proxima")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/celebrations/feria-kimsapampa-pasada")).andExpect(status().isOk());
    }

    /** Fechas que se repiten cada año (spec 2026-10-16): nunca pasan a «pasadas» y salen en «Hoy se celebra» su día. */
    @Test
    void yearlyDatesComeBackEveryYearAndShowUpOnTheirDay() throws Exception {
        String token = createUserAndLogin("fechas-anuales@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(token, "Fechas cívicas Test");
        java.time.ZoneId lima = java.time.ZoneId.of("America/Lima");
        java.time.LocalDate today = java.time.LocalDate.now(lima);
        java.time.LocalDate yesterday = today.minusDays(1);

        String todayId = createDate(token, categoryId, "Día kimsapampino de hoy", today.withYear(1900), true, 1900);
        String yesterdayId = createDate(token, categoryId, "Día kimsapampino de ayer", yesterday.withYear(1900), true, null);
        for (String id : new String[] {todayId, yesterdayId}) {
            mockMvc.perform(post("/api/v1/admin/celebrations/" + id + "/publish").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());
        }

        String midnightToday = today.atStartOfDay(lima).toInstant().toString();
        mockMvc.perform(get("/api/v1/celebrations").param("categoryId", categoryId).param("when", "upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].slug").value("dia-kimsapampino-de-hoy"))
                .andExpect(jsonPath("$.items[0].nextOccurrenceAt").value(midnightToday))
                .andExpect(jsonPath("$.items[0].recursYearly").value(true))
                .andExpect(jsonPath("$.items[0].sinceYear").value(1900))
                // La de ayer vuelve el próximo año, no se va a «pasadas».
                .andExpect(jsonPath("$.items[1].slug").value("dia-kimsapampino-de-ayer"))
                .andExpect(jsonPath("$.items[1].nextOccurrenceAt")
                        .value(yesterday.plusYears(1).atStartOfDay(lima).toInstant().toString()));
        mockMvc.perform(get("/api/v1/celebrations").param("categoryId", categoryId).param("when", "past"))
                .andExpect(jsonPath("$.totalElements").value(0));

        mockMvc.perform(get("/api/v1/celebrations/today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.slug == 'dia-kimsapampino-de-hoy')]").exists())
                .andExpect(jsonPath("$[?(@.slug == 'dia-kimsapampino-de-ayer')]").doesNotExist());
    }

    /**
     * Modelo de los Doodles de Google: cada celebración tiene alcance (mundial,
     * país o región) y «Hoy se celebra» muestra solo lo del lugar del visitante
     * (cabeceras de Cloudflare), de lo más cercano a lo más general.
     */
    @Test
    void todayShowsOnlyWhatIsCelebratedWhereTheVisitorIs() throws Exception {
        String token = createUserAndLogin("celebraciones-geo@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(token, "Celebraciones geo Test");
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("America/Lima"));

        String world = publishScoped(token, categoryId, "Kimsa mundial", today, null, null);
        String peru = publishScoped(token, categoryId, "Kimsa peruana", today, "pe", null);
        String ayacucho = publishScoped(token, categoryId, "Kimsa ayacuchana", today, "PE", "Ayacucho");
        String mexico = publishScoped(token, categoryId, "Kimsa mexicana", today, "MX", null);

        // Visitante en Ayacucho: región, luego país, luego mundial; nada de México.
        java.util.List<String> fromAyacucho = todaySlugs("PE", "Región de Ayacucho");
        assertOrder(fromAyacucho, ayacucho, peru, world);
        org.assertj.core.api.Assertions.assertThat(fromAyacucho).doesNotContain(mexico);

        // Visitante en Lima: lo peruano y lo mundial, no lo de Ayacucho.
        java.util.List<String> fromLima = todaySlugs("PE", "Lima");
        assertOrder(fromLima, peru, world);
        org.assertj.core.api.Assertions.assertThat(fromLima).doesNotContain(ayacucho, mexico);

        // Visitante en México.
        java.util.List<String> fromMexico = todaySlugs("MX", null);
        assertOrder(fromMexico, mexico, world);
        org.assertj.core.api.Assertions.assertThat(fromMexico).doesNotContain(peru, ayacucho);

        // Sin ubicación (VPN, local): lo mundial y lo del país del sitio (Perú por defecto), sin regiones.
        java.util.List<String> unknown = todaySlugs(null, null);
        assertOrder(unknown, peru, world);
        org.assertj.core.api.Assertions.assertThat(unknown).doesNotContain(ayacucho, mexico);

        // La respuesta dice dónde se celebra.
        mockMvc.perform(get("/api/v1/celebrations/today").header("CF-IPCountry", "PE").header("CF-Region", "Ayacucho"))
                .andExpect(jsonPath("$[?(@.slug == '" + ayacucho + "')].scopeCountry").value(org.hamcrest.Matchers.hasItem("PE")))
                .andExpect(jsonPath("$[?(@.slug == '" + ayacucho + "')].scopeRegion").value(org.hamcrest.Matchers.hasItem("Ayacucho")));
    }

    @Test
    void scopeMustBeACountryCodeAndARegionNeedsItsCountry() throws Exception {
        String token = createUserAndLogin("celebraciones-geo-validacion@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(token, "Celebraciones geo validación Test");
        for (String scope : new String[] {"\"scopeCountry\":\"Peru\"", "\"scopeRegion\":\"Ayacucho\""}) {
            mockMvc.perform(post("/api/v1/admin/celebrations").header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"title\":\"Kimsa inválida\",\"body\":\"Texto.\",\"categoryId\":\"" + categoryId
                                    + "\",\"startsAt\":\"2030-06-14T05:00:00Z\",\"recursYearly\":true,\"allDay\":true," + scope + "}"))
                    .andExpect(status().isBadRequest());
        }
    }

    private String publishScoped(String token, String categoryId, String title, java.time.LocalDate day, String country,
            String region) throws Exception {
        String startsAt = day.withYear(2000).atStartOfDay(java.time.ZoneId.of("America/Lima")).toInstant().toString();
        String scope = (country == null ? "" : ",\"scopeCountry\":\"" + country + "\"")
                + (region == null ? "" : ",\"scopeRegion\":\"" + region + "\"");
        MvcResult result = mockMvc.perform(post("/api/v1/admin/celebrations").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + " " + UUID.randomUUID().toString().substring(0, 6)
                                + "\",\"body\":\"Texto.\",\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"" + startsAt
                                + "\",\"recursYearly\":true,\"allDay\":true" + scope + "}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        mockMvc.perform(post("/api/v1/admin/celebrations/" + id + "/publish").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        return textField(result, "slug");
    }

    private java.util.List<String> todaySlugs(String country, String region) throws Exception {
        var request = get("/api/v1/celebrations/today");
        if (country != null) {
            request = request.header("CF-IPCountry", country);
        }
        if (region != null) {
            request = request.header("CF-Region", region);
        }
        JsonNode items = objectMapper.readTree(mockMvc.perform(request).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        java.util.List<String> slugs = new java.util.ArrayList<>();
        items.forEach(item -> slugs.add(item.get("slug").asText()));
        return slugs;
    }

    private static void assertOrder(java.util.List<String> slugs, String... expectedInOrder) {
        org.assertj.core.api.Assertions.assertThat(slugs).contains(expectedInOrder);
        for (int i = 1; i < expectedInOrder.length; i++) {
            org.assertj.core.api.Assertions.assertThat(slugs.indexOf(expectedInOrder[i - 1]))
                    .isLessThan(slugs.indexOf(expectedInOrder[i]));
        }
    }

    @Test
    void sinceYearOnlyMakesSenseForYearlyDates() throws Exception {
        String token = createUserAndLogin("fechas-desde@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(token, "Fechas desde Test");
        mockMvc.perform(post("/api/v1/admin/celebrations").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Eclipse kimsapampino\",\"body\":\"Texto.\",\"categoryId\":\"" + categoryId
                                + "\",\"startsAt\":\"2030-06-14T19:00:00Z\",\"recursYearly\":false,\"sinceYear\":1824}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsEndsAtBeforeStartsAt() throws Exception {
        String creatorToken = createUserAndLogin("celebrations-creador-3@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String publisherToken = createUserAndLogin("celebrations-publicador-3@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(publisherToken, "Categoría Fechas Test");

        mockMvc.perform(post("/api/v1/admin/celebrations")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Evento con fechas invertidas\",\"body\":\"Descripción.\","
                                + "\"categoryId\":\"" + categoryId + "\","
                                + "\"startsAt\":\"2030-06-14T19:00:00Z\",\"endsAt\":\"2030-06-14T10:00:00Z\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsUnknownPlaceId() throws Exception {
        String creatorToken = createUserAndLogin("celebrations-creador-4@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String publisherToken = createUserAndLogin("celebrations-publicador-4@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(publisherToken, "Categoría Lugar Inexistente Test");

        mockMvc.perform(post("/api/v1/admin/celebrations")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Evento en lugar inexistente\",\"body\":\"Descripción.\","
                                + "\"categoryId\":\"" + categoryId + "\","
                                + "\"placeId\":\"00000000-0000-0000-0000-000000000000\","
                                + "\"startsAt\":\"2030-06-14T19:00:00Z\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void teammateCanPublishSomeoneElsesCelebration() throws Exception {
        String publisherToken = createUserAndLogin("celebrations-publicador-5@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("celebrations-creador-5@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String otherCreatorToken = createUserAndLogin("celebrations-creador-6@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Categoría Evento Ajeno Test");

        String celebrationId = createDraftCelebration(creatorToken, categoryId, "Concierto privado", "2030-06-14T19:00:00Z");

        mockMvc.perform(post("/api/v1/admin/celebrations/" + celebrationId + "/publish")
                        .header("Authorization", "Bearer " + otherCreatorToken))
                .andExpect(status().isOk());
    }

    private String publishCelebration(String creatorToken, String publisherToken, String categoryId, String title,
            String startsAt) throws Exception {
        String celebrationId = createDraftCelebration(creatorToken, categoryId, title, startsAt);
        mockMvc.perform(post("/api/v1/admin/celebrations/" + celebrationId + "/publish")
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());
        return celebrationId;
    }

    private String createDraftCelebration(String creatorToken, String categoryId, String title, String startsAt)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/celebrations")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Descripción completa del evento, con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"" + startsAt + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();
        return textField(result, "id");
    }

    private String createDate(String token, String categoryId, String title, java.time.LocalDate date, boolean yearly,
            Integer sinceYear) throws Exception {
        String startsAt = date.atStartOfDay(java.time.ZoneId.of("America/Lima")).toInstant().toString();
        MvcResult result = mockMvc.perform(post("/api/v1/admin/celebrations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"body\":\"Por qué se celebra.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"" + startsAt + "\","
                                + "\"recursYearly\":" + yearly + ",\"allDay\":true"
                                + (sinceYear == null ? "" : ",\"sinceYear\":" + sinceYear) + "}"))
                .andExpect(status().isCreated())
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
