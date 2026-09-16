package pe.plataformacontenidos.advertising;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
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

/**
 * Cubre el flujo completo de publicidad directa: crear anunciante + campaña,
 * resolverla como AdBlock haría antes de caer a AdSense (con conteo de
 * impresión), contar un clic con redirect, y las validaciones de negocio
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

    @Test
    void campaignIsServedToPublicAndCountsImpressionsAndClicks() throws Exception {
        String adminToken = createUserAndLogin("ads-admin-1@plataforma-contenidos.test");
        String placementKey = createAdPlacement(adminToken);
        String advertiserId = createAdvertiser(adminToken, "Panadería La Espiga");

        MvcResult created = mockMvc.perform(post("/api/v1/admin/campaigns")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(campaignJson(advertiserId, placementKey, "https://example.com/banner.jpg", null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.impressionCount").value(0))
                .andReturn();
        String campaignId = textField(created, "id");

        // Sin campaña vigente para otra posición: 204.
        mockMvc.perform(get("/api/v1/ads/campaigns/active").param("placementKey", "posicion-inexistente"))
                .andExpect(status().isNoContent());

        // AdBlock resuelve la posición real: 200 y cuenta como impresión.
        mockMvc.perform(get("/api/v1/ads/campaigns/active").param("placementKey", placementKey))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(campaignId))
                .andExpect(jsonPath("$.externalImageUrl").value("https://example.com/banner.jpg"));

        mockMvc.perform(get("/api/v1/admin/campaigns/" + campaignId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.impressionCount").value(1))
                .andExpect(jsonPath("$.clickCount").value(0));

        // El lector hace clic: redirect 302 al link real, nunca expuesto antes en el HTML.
        mockMvc.perform(get("/api/v1/ads/campaigns/" + campaignId + "/click"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://laespiga.example.com"));

        mockMvc.perform(get("/api/v1/admin/campaigns/" + campaignId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clickCount").value(1));

        // Desactivada, deja de servirse.
        mockMvc.perform(post("/api/v1/admin/campaigns/" + campaignId + "/deactivate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/ads/campaigns/active").param("placementKey", placementKey))
                .andExpect(status().isNoContent());
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
