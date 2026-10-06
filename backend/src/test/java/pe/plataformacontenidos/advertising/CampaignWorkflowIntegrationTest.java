package pe.plataformacontenidos.advertising;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Cubre el flujo completo de publicidad directa: crear anunciante + campaña,
 * rotación pública (sin contar), impresión visible y clic válidos (sin
 * robots ni duplicados), tope de frecuencia, reporte diario, y las validaciones de negocio
 * (creatividad XOR, vigencia, borrado de anunciante con campañas activas).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class CampaignWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private StringRedisTemplate redis;

    @Test
    void campaignIsServedToPublicAndCountsViewableImpressionsAndValidClicks() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-1@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Panadería La Espiga");

        MvcResult created = mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaignJson(advertiserId, placementKey, "https://example.com/banner.jpg", null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.impressionCount").value(0))
                .andExpect(jsonPath("$.weight").value(5))
                .andReturn();
        String campaignId = textField(created, "id");

        // Sin campaña vigente para otra posición: 204.
        mockMvc.perform(get("/api/v1/ads/campaigns/rotation").param("placementKey", "posicion-inexistente"))
                .andExpect(status().isNoContent());

        // La rotación trae la medida de la posición y las campañas, sin contar impresión.
        mockMvc.perform(get("/api/v1/ads/campaigns/rotation").param("placementKey", placementKey))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.width").value(300))
                .andExpect(jsonPath("$.height").value(250))
                .andExpect(jsonPath("$.campaigns[0].id").value(campaignId))
                .andExpect(jsonPath("$.campaigns[0].externalImageUrl").value("https://example.com/banner.jpg"));
        expectCounts(adminToken, campaignId, 0, 0);

        // Vista real informada por el navegador: cuenta. Repetida al instante o desde un robot: no.
        mockMvc.perform(post("/api/v1/ads/campaigns/" + campaignId + "/impression").with(visitor("203.0.113.10", BROWSER)))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/ads/campaigns/" + campaignId + "/impression").with(visitor("203.0.113.10", BROWSER)))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/ads/campaigns/" + campaignId + "/impression").with(visitor("203.0.113.11", BOT)))
                .andExpect(status().isNoContent());
        expectCounts(adminToken, campaignId, 1, 0);

        // Clic: siempre redirige al link real; solo el primero de la persona cuenta.
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(get("/api/v1/ads/campaigns/" + campaignId + "/click").with(visitor("203.0.113.10", BROWSER)))
                    .andExpect(status().isFound())
                    .andExpect(header().string("Location", "https://laespiga.example.com"));
        }
        expectCounts(adminToken, campaignId, 1, 1);

        // Reporte diario para el anunciante.
        mockMvc.perform(get("/api/v1/admin/campaigns/" + campaignId + "/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].impressions").value(1))
                .andExpect(jsonPath("$[0].clicks").value(1));

        // Desactivada, deja de servirse.
        mockMvc.perform(post("/api/v1/admin/campaigns/" + campaignId + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/ads/campaigns/rotation").param("placementKey", placementKey))
                .andExpect(status().isNoContent());
    }

    @Test
    void visitorWhoReachedTheDailyFrequencyCapStopsSeeingTheCampaign() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-6@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Pollería El Dorado");
        MvcResult created = mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaignJson(advertiserId, placementKey, "https://example.com/banner.jpg", null)))
                .andExpect(status().isCreated())
                .andReturn();
        String campaignId = textField(created, "id");

        String capped = "198.51.100.7";
        redis.opsForValue().set("ads:freq:" + LocalDate.now(ZoneOffset.UTC) + ":" + campaignId + ":"
                + AdDeliveryGuard.visitorKey(capped), String.valueOf(AdDeliveryGuard.DAILY_FREQUENCY_CAP));

        mockMvc.perform(get("/api/v1/ads/campaigns/rotation").param("placementKey", placementKey)
                        .with(visitor(capped, BROWSER)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/ads/campaigns/rotation").param("placementKey", placementKey)
                        .with(visitor("198.51.100.8", BROWSER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.campaigns[0].id").value(campaignId));
    }

    @Test
    void campaignWeightMustBeBetweenOneAndTen() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-7@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Botica Santa Rosa");
        String body = campaignJson(advertiserId, placementKey, "https://example.com/banner.jpg", null);

        mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("}", ",\"weight\":11}")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("}", ",\"weight\":9}")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.weight").value(9));
    }

    @Test
    void contextualTargetingPutsTheMatchingCampaignFirstAndHidesItElsewhere() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-8@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Hostal Plaza");
        String everywhere = textField(mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaignJson(advertiserId, placementKey, "https://example.com/a.jpg", null)))
                .andExpect(status().isCreated()).andReturn(), "id");
        String placesInPeru = textField(mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaignJson(advertiserId, placementKey, "https://example.com/b.jpg", null)
                                .replace("}", ",\"targetSections\":[\"PLACE\"],\"targetCountries\":[\"pe\"]}")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.targetSections[0]").value("PLACE"))
                .andExpect(jsonPath("$.targetCountries[0]").value("PE"))
                .andReturn(), "id");

        // En Lugares, desde Perú: la segmentada va primero (más específica), la general después.
        mockMvc.perform(get("/api/v1/ads/campaigns/rotation").param("placementKey", placementKey)
                        .param("section", "PLACE").header("CF-IPCountry", "PE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.campaigns.length()").value(2))
                .andExpect(jsonPath("$.campaigns[0].id").value(placesInPeru))
                .andExpect(jsonPath("$.campaigns[1].id").value(everywhere));

        // En Eventos, o sin saber el país del visitante: solo la general.
        mockMvc.perform(get("/api/v1/ads/campaigns/rotation").param("placementKey", placementKey)
                        .param("section", "EVENT").header("CF-IPCountry", "PE"))
                .andExpect(jsonPath("$.campaigns.length()").value(1))
                .andExpect(jsonPath("$.campaigns[0].id").value(everywhere));
        mockMvc.perform(get("/api/v1/ads/campaigns/rotation").param("placementKey", placementKey)
                        .param("section", "PLACE"))
                .andExpect(jsonPath("$.campaigns.length()").value(1));
    }

    @Test
    void placementAcceptsAtMostFiveCompetingCampaignsForTheSameAudience() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-9@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Agencia Wari Tours");
        String body = campaignJson(advertiserId, placementKey, "https://example.com/a.jpg", null);
        for (int i = 0; i < CampaignService.MAX_COMPETING_CAMPAIGNS; i++) {
            mockMvc.perform(post("/api/v1/admin/campaigns").header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isCreated());
        }
        // La sexta para el mismo público y fechas: cupo lleno.
        mockMvc.perform(post("/api/v1/admin/campaigns").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
        // Un público que no se cruza (otra sección, cuando las 5 son solo de Eventos) sí entra.
        String eventsOnly = createAdPlacement(adminToken);
        String eventsBody = campaignJson(advertiserId, eventsOnly, "https://example.com/a.jpg", null)
                .replace("}", ",\"targetSections\":[\"EVENT\"]}");
        for (int i = 0; i < CampaignService.MAX_COMPETING_CAMPAIGNS; i++) {
            mockMvc.perform(post("/api/v1/admin/campaigns").header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON).content(eventsBody))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(post("/api/v1/admin/campaigns").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventsBody.replace("EVENT", "PLACE")))
                .andExpect(status().isCreated());
    }

    private static final String BROWSER =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
    private static final String BOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

    private static RequestPostProcessor visitor(String ip, String userAgent) {
        return request -> {
            request.setRemoteAddr(ip);
            request.addHeader("User-Agent", userAgent);
            return request;
        };
    }

    private void expectCounts(String adminToken, String campaignId, long impressions, long clicks) throws Exception {
        mockMvc.perform(get("/api/v1/admin/campaigns/" + campaignId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.impressionCount").value(impressions))
                .andExpect(jsonPath("$.clickCount").value(clicks));
    }

    @Test
    void campaignStoresAmountAndRejectsNegativeAmount() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-5@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Hostal Wari");

        String body = "{"
                + "\"advertiserId\":\"" + advertiserId + "\","
                + "\"placementKey\":\"" + placementKey + "\","
                + "\"externalImageUrl\":\"https://example.com/banner.jpg\","
                + "\"linkUrl\":\"https://example.com\","
                + "\"amount\":150.50,"
                + "\"currency\":\"PEN\""
                + "}";

        mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amount").value(150.50))
                .andExpect(jsonPath("$.currency").value("PEN"));

        String negativeBody = "{"
                + "\"advertiserId\":\"" + advertiserId + "\","
                + "\"placementKey\":\"" + placementKey + "\","
                + "\"externalImageUrl\":\"https://example.com/banner.jpg\","
                + "\"linkUrl\":\"https://example.com\","
                + "\"amount\":-10,"
                + "\"currency\":\"PEN\""
                + "}";

        mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(negativeBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void campaignCreativeMustHaveExactlyOneImageSource() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-2@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Librería El Sótano");

        // Ninguna fuente.
        mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaignJson(advertiserId, placementKey, null, null)))
                .andExpect(status().isBadRequest());

        // Ambas fuentes a la vez.
        mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaignJson(advertiserId, placementKey, "https://example.com/a.jpg",
                                UUID.randomUUID())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void campaignScheduleMustHaveEndAfterStart() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-3@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Ferretería San Martín");

        String body = "{"
                + "\"advertiserId\":\"" + advertiserId + "\","
                + "\"placementKey\":\"" + placementKey + "\","
                + "\"externalImageUrl\":\"https://example.com/banner.jpg\","
                + "\"linkUrl\":\"https://example.com\","
                + "\"startsAt\":\"" + Instant.now() + "\","
                + "\"endsAt\":\"" + Instant.now().minusSeconds(3600) + "\""
                + "}";

        mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void advertiserWithCampaignsCannotBeDeleted() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-4@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Café Central");

        mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaignJson(advertiserId, placementKey, "https://example.com/banner.jpg", null)))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/v1/admin/advertisers/" + advertiserId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict());
    }

    private String campaignJson(String advertiserId, String placementKey, String externalImageUrl, UUID imageId) {
        StringBuilder json = new StringBuilder("{");
        json.append("\"advertiserId\":\"").append(advertiserId).append("\",");
        json.append("\"placementKey\":\"").append(placementKey).append("\",");
        if (externalImageUrl != null) {
            json.append("\"externalImageUrl\":\"").append(externalImageUrl).append("\",");
        }
        if (imageId != null) {
            json.append("\"imageId\":\"").append(imageId).append("\",");
        }
        json.append("\"linkUrl\":\"https://laespiga.example.com\"");
        json.append("}");
        return json.toString();
    }

    private String createAdPlacement(String adminToken) throws Exception {
        String key = "test-slot-" + UUID.randomUUID().toString().substring(0, 8);
        mockMvc.perform(post("/api/v1/admin/ad-placements")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"key\":\"" + key + "\",\"label\":\"Posición de prueba\"}"))
                .andExpect(status().isCreated());
        return key;
    }

    private String createAdvertiser(String adminToken, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/advertisers")
                        .header("Authorization", "Bearer " + adminToken)
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

    private String createUserAndLogin(String email) throws Exception {
        String password = "SomeStrongPassword123!";
        userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "Admin", Role.ADMIN));

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return textField(result, "accessToken");
    }
}
