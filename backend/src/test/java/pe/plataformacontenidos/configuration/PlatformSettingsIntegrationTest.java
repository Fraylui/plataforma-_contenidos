package pe.plataformacontenidos.configuration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.WorkerPermission;
import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import tools.jackson.databind.ObjectMapper;

/** Configuración (V73, 2026-10-21): redes oficiales validadas y campos unificados. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class PlatformSettingsIntegrationTest {

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
    void theOfficialSocialLinksAreSavedAndShownToTheSite() throws Exception {
        String token = settingsManagerToken("config-redes@plataforma-contenidos.test");

        mockMvc.perform(put("/api/v1/admin/platform-settings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ecos","description":"Descubre lugares y su historia.",
                                 "youtubeUrl":"https://youtube.com/@ecos","instagramUrl":"https://instagram.com/ecos",
                                 "tiktokUrl":"https://tiktok.com/@ecos","facebookUrl":"https://facebook.com/ecos",
                                 "xUrl":"https://x.com/ecos","adsenseEnabled":false}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.youtubeUrl").value("https://youtube.com/@ecos"));

        // Lectura pública (sin token): el sitio muestra los íconos con estos enlaces.
        mockMvc.perform(get("/api/v1/platform-settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.instagramUrl").value("https://instagram.com/ecos"))
                .andExpect(jsonPath("$.xUrl").value("https://x.com/ecos"))
                .andExpect(jsonPath("$.description").value("Descubre lugares y su historia."))
                // Ya no existen: los duplicados «SEO» y los campos sin uso.
                .andExpect(jsonPath("$.seoDefaultDescription").doesNotExist())
                .andExpect(jsonPath("$.primaryColor").doesNotExist());
    }

    @Test
    void aLinkFromAnotherNetworkIsRejectedWithAClearMessage() throws Exception {
        String token = settingsManagerToken("config-redes-mal@plataforma-contenidos.test");

        mockMvc.perform(put("/api/v1/admin/platform-settings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ecos\",\"youtubeUrl\":\"https://instagram.com/ecos\",\"adsenseEnabled\":false}"))
                .andExpect(status().isBadRequest());
    }

    private String settingsManagerToken(String email) throws Exception {
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "Config", Role.WORKER));
        workerPermissions.save(new WorkerPermission(created.getId(), Module.SETTINGS, AccessLevel.ACCESS));
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(login.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
