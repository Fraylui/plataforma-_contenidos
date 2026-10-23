package pe.plataformacontenidos.advertising;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.UUID;
import javax.imageio.ImageIO;
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
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;
import pe.plataformacontenidos.identity.permission.TestProfile;
import pe.plataformacontenidos.identity.internal.WorkerPermissionRepository;
import tools.jackson.databind.ObjectMapper;

/**
 * Anuncio nativo del feed (spec 2026-10-16): post con logo y nombre del
 * anunciante, texto, foto o video de YouTube y botón de acción. Solo va en
 * la posición del feed; cuenta reproducciones además de impresiones y clics.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class NativeCampaignIntegrationTest {

    private static final String FEED = "en-feed";
    private static final String BROWSER =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
    private static final String BOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkerPermissionRepository workerPermissions;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    void nativeVideoAdIsServedWithAdvertiserIdentityAndCountsPlays() throws Exception {
        String token = login();
        String logoId = uploadImage(token, 400, 400);
        String advertiserId = createAdvertiser(token, "Pollería El Inca", logoId);

        String campaignId = id(mockMvc.perform(post("/api/v1/admin/campaigns").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nativeJson(advertiserId, "\"videoUrl\":\"https://youtu.be/dQw4w9WgXcQ\"",
                                "https://wa.me/51999999999")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.format").value("NATIVE"))
                .andExpect(jsonPath("$.placementKey").value(FEED))
                .andExpect(jsonPath("$.youtubeVideoId").value("dQw4w9WgXcQ"))
                .andExpect(jsonPath("$.mediaAspect").value("16:9"))
                .andReturn());

        String path = "$.campaigns[?(@.id == '" + campaignId + "')]";
        mockMvc.perform(get("/api/v1/ads/campaigns/rotation").param("placementKey", FEED))
                .andExpect(status().isOk())
                .andExpect(jsonPath(path + ".format", hasItem("NATIVE")))
                .andExpect(jsonPath(path + ".advertiserName", hasItem("Pollería El Inca")))
                .andExpect(jsonPath(path + ".advertiserLogoImageId", hasItem(logoId)))
                .andExpect(jsonPath(path + ".primaryText", hasItem("2x1 los martes en todo el menú")))
                .andExpect(jsonPath(path + ".headline", hasItem("Pollo a la brasa")))
                .andExpect(jsonPath(path + ".callToAction", hasItem("WHATSAPP")))
                .andExpect(jsonPath(path + ".displayDomain", hasItem("wa.me")))
                .andExpect(jsonPath(path + ".youtubeVideoId", hasItem("dQw4w9WgXcQ")))
                .andExpect(jsonPath(path + ".mediaAspect", hasItem("16:9")));

        // Reproducción: una por persona; los robots no cuentan.
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/v1/ads/campaigns/" + campaignId + "/play").with(visitor("198.51.100.20", BROWSER)))
                    .andExpect(status().isNoContent());
        }
        mockMvc.perform(post("/api/v1/ads/campaigns/" + campaignId + "/play").with(visitor("198.51.100.21", BOT)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/admin/campaigns/" + campaignId).header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.playCount").value(1));
        mockMvc.perform(get("/api/v1/admin/campaigns/" + campaignId + "/stats").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[0].plays").value(1));
    }

    @Test
    void nativePhotoMustHaveAFeedProportion() throws Exception {
        String token = login();
        String advertiserId = createAdvertiser(token, "Hostal Plaza", null);

        String square = uploadImage(token, 1080, 1080);
        mockMvc.perform(post("/api/v1/admin/campaigns").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nativeJson(advertiserId, "\"imageId\":\"" + square + "\"", "https://hostalplaza.example.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mediaAspect").value("1:1"));

        String portrait = uploadImage(token, 1080, 1350);
        mockMvc.perform(post("/api/v1/admin/campaigns").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nativeJson(advertiserId, "\"imageId\":\"" + portrait + "\"", "https://hostalplaza.example.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mediaAspect").value("4:5"));

        // Un banner 300×250 no es un post del feed.
        String banner = uploadImage(token, 600, 500);
        mockMvc.perform(post("/api/v1/admin/campaigns").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nativeJson(advertiserId, "\"imageId\":\"" + banner + "\"", "https://hostalplaza.example.com")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nativeAdRejectsWhatWouldBreakTheFeedPost() throws Exception {
        String token = login();
        String advertiserId = createAdvertiser(token, "Tienda Andina", null);
        String video = "\"videoUrl\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"";

        // Sin foto ni video
        expectBadRequest(token, nativeJson(advertiserId, "\"headline\":null", "https://tienda.example.com"));
        // Foto y video a la vez
        String image = uploadImage(token, 1080, 1080);
        expectBadRequest(token, nativeJson(advertiserId, video + ",\"imageId\":\"" + image + "\"", "https://tienda.example.com"));
        // Link que no es de YouTube
        expectBadRequest(token, nativeJson(advertiserId, "\"videoUrl\":\"https://vimeo.com/1\"", "https://tienda.example.com"));
        // Destino que no es una web
        expectBadRequest(token, nativeJson(advertiserId, video, "javascript:alert(1)"));
        // Fuera del feed
        expectBadRequest(token, nativeJson(advertiserId, video + ",\"placementKey\":\"publication\"", "https://tienda.example.com"));
        // Sin texto
        expectBadRequest(token, nativeJson(advertiserId, video, "https://tienda.example.com").replace("2x1 los martes en todo el menú", ""));
    }

    @Test
    void advertiserLogoMustExistAndCanBeCleared() throws Exception {
        String token = login();
        String advertiserId = createAdvertiser(token, "Agencia Cusco", null);

        mockMvc.perform(put("/api/v1/admin/advertisers/" + advertiserId).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Agencia Cusco\",\"logoImageId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isBadRequest());

        String logo = uploadImage(token, 300, 300);
        mockMvc.perform(put("/api/v1/admin/advertisers/" + advertiserId).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Agencia Cusco\",\"logoImageId\":\"" + logo + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logoImageId").value(logo));

        mockMvc.perform(put("/api/v1/admin/advertisers/" + advertiserId).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Agencia Cusco\",\"logoImageId\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logoImageId").doesNotExist());
    }

    private void expectBadRequest(String token, String json) throws Exception {
        mockMvc.perform(post("/api/v1/admin/campaigns").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest());
    }

    /** `media` son campos JSON extra (foto, video, posición…) que se agregan al cuerpo base. */
    private static String nativeJson(String advertiserId, String media, String linkUrl) {
        return "{\"advertiserId\":\"" + advertiserId + "\",\"format\":\"NATIVE\",\"complianceConfirmed\":true,"
                + "\"primaryText\":\"2x1 los martes en todo el menú\",\"headline\":\"Pollo a la brasa\","
                + "\"callToAction\":\"WHATSAPP\",\"linkUrl\":\"" + linkUrl + "\"," + media + "}";
    }

    private String createAdvertiser(String token, String name, String logoImageId) throws Exception {
        String logo = logoImageId == null ? "" : ",\"logoImageId\":\"" + logoImageId + "\"";
        return id(mockMvc.perform(post("/api/v1/admin/advertisers").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"" + logo + "}"))
                .andExpect(status().isCreated())
                .andReturn());
    }

    private String uploadImage(String token, int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        MockMultipartFile file = new MockMultipartFile("file", "anuncio.png", "image/png", out.toByteArray());
        return id(mockMvc.perform(multipart("/api/v1/admin/images").file(file).header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn());
    }

    private String id(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private static RequestPostProcessor visitor(String ip, String userAgent) {
        return request -> {
            request.setRemoteAddr(ip);
            request.addHeader("User-Agent", userAgent);
            return request;
        };
    }

    private String login() throws Exception {
        String email = "native-ads-" + UUID.randomUUID() + "@plataforma-contenidos.test";
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "Ads",
                TestProfile.PUBLICADOR_CON_PUBLICIDAD.toRole()));
        TestProfile.PUBLICADOR_CON_PUBLICIDAD.grant(workerPermissions, created.getId());
        return objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).get("accessToken").asText();
    }
}
