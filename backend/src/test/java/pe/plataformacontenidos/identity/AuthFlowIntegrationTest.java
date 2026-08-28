package pe.plataformacontenidos.identity;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import pe.plataformacontenidos.TestcontainersConfiguration;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
        "app.security.bootstrap-admin-email=admin@plataforma-contenidos.test",
        "app.security.bootstrap-admin-password=Sup3rSecret!Password",
        "app.security.login-rate-limit.max-attempts=3"
})
class AuthFlowIntegrationTest {

    private static final String ADMIN_EMAIL = "admin@plataforma-contenidos.test";
    private static final String ADMIN_PASSWORD = "Sup3rSecret!Password";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void loginWithBootstrappedAdminSucceedsAndReturnsTokens() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_EMAIL, ADMIN_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void loginWithWrongPasswordFails() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_EMAIL, "wrong-password")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void repeatedFailedLoginsAreRateLimited() throws Exception {
        String email = "rate-limited-user@plataforma-contenidos.test";
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginJson(email, "whatever")))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, "whatever")))
                .andExpect(status().isTooManyRequests());
    }

    /**
     * Regresión del hallazgo de la auditoría COBIT 2019 (2026-08-27):
     * AuthController.clientIp() confiaba en X-Forwarded-For sin validar que
     * viniera de un proxy confiable — un atacante podía mandar un valor
     * distinto en cada intento y evadir el rate limit por completo. Ahora
     * usa getRemoteAddr(), así que variar esa cabecera no debe cambiar nada:
     * el límite se cumple igual (mismo comportamiento que
     * repeatedFailedLoginsAreRateLimited, pero probando que la cabecera
     * falsificada no lo evade).
     */
    @Test
    void spoofedForwardedForHeaderDoesNotBypassRateLimit() throws Exception {
        String email = "xff-spoof-user@plataforma-contenidos.test";
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .header("X-Forwarded-For", "10.0.0." + i)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginJson(email, "whatever")))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "10.0.0.99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, "whatever")))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void meEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void meEndpointReturnsCurrentUserWithValidToken() throws Exception {
        String accessToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$.role").value("SUPER_ADMIN"));
    }

    @Test
    void refreshTokenRotatesAndOldTokenCannotBeReused() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_EMAIL, ADMIN_PASSWORD)))
                .andExpect(status().isOk())
                .andReturn();

        var tokens = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String refreshToken = tokens.get("refreshToken").asText();

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        // El refresh token ya fue consumido (rotado): reutilizarlo debe fallar
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointsRejectNonAdminAndAllowAdmin() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);

        String createUserJson = objectMapper.writeValueAsString(new java.util.HashMap<>() {{
            put("email", "editor@plataforma-contenidos.test");
            put("password", "AnotherSecret123!");
            put("firstName", "Editor");
            put("lastName", "de Prueba");
            put("role", "EDITOR");
        }});

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("EDITOR"));

        String editorToken = login("editor@plataforma-contenidos.test", "AnotherSecret123!");

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void deactivatingOwnAccountIsBlocked() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        String ownId = currentUserId(adminToken);

        mockMvc.perform(delete("/api/v1/admin/users/" + ownId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict());
    }

    /** CONTEXTO.md sección 36.4: un ADMIN no gestiona cuentas SUPER_ADMIN. */
    @Test
    void adminCannotCreateOrDeactivateSuperAdmin() throws Exception {
        String superAdminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        String superAdminId = currentUserId(superAdminToken);

        createUser(superAdminToken, "plain-admin@plataforma-contenidos.test", "AnotherSecret123!", "ADMIN");
        String plainAdminToken = login("plain-admin@plataforma-contenidos.test", "AnotherSecret123!");

        String createSuperJson = objectMapper.writeValueAsString(new java.util.HashMap<>() {{
            put("email", "wannabe-super@plataforma-contenidos.test");
            put("password", "AnotherSecret123!");
            put("firstName", "Wannabe");
            put("lastName", "Super");
            put("role", "SUPER_ADMIN");
        }});
        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + plainAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createSuperJson))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/admin/users/" + superAdminId)
                        .header("Authorization", "Bearer " + plainAdminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void deactivatedUserCannotLoginAndReactivatingRestoresAccess() throws Exception {
        String adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
        String email = "to-deactivate@plataforma-contenidos.test";
        String password = "AnotherSecret123!";
        String userId = createUser(adminToken, email, password, "AUTHOR");

        login(email, password); // funciona mientras está activo

        mockMvc.perform(delete("/api/v1/admin/users/" + userId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISABLED"));
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/admin/users/" + userId + "/activate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        login(email, password); // vuelve a funcionar
    }

    private String currentUserId(String accessToken) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createUser(String actingAdminToken, String email, String password, String role) throws Exception {
        String json = objectMapper.writeValueAsString(new java.util.HashMap<>() {{
            put("email", email);
            put("password", password);
            put("firstName", "Usuario");
            put("lastName", "de prueba");
            put("role", role);
        }});
        MvcResult result = mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + actingAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private String loginJson(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }
}
