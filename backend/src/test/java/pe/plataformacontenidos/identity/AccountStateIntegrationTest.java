package pe.plataformacontenidos.identity;

import static org.assertj.core.api.Assertions.assertThat;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.WorkerPermission;
import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Spec 2a §4.3 y §5: contraseña temporal, cambio de contraseña y desactivación inmediata. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class AccountStateIntegrationTest {

    private static final String PASSWORD = "ClaveTemporal123";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkerPermissionRepository permissions;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JdbcTemplate jdbc;

    private User worker(boolean mustChangePassword) {
        User user = userRepository.save(new User(UUID.randomUUID() + "@state.test", passwordEncoder.encode(PASSWORD), "A", "B", Role.WORKER));
        permissions.save(new WorkerPermission(user.getId(), Module.EVENTS, AccessLevel.PUBLISH));
        jdbc.update("UPDATE identity.users SET must_change_password = ? WHERE id = ?", mustChangePassword, user.getId());
        return user;
    }

    private JsonNode login(String email, String password) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    @Test
    void temporaryPasswordOnlyAllowsChangingIt() throws Exception {
        User user = worker(true);
        JsonNode tokens = login(user.getEmail(), PASSWORD);
        String token = tokens.get("accessToken").asText();

        mockMvc.perform(get("/api/v1/admin/events").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("PASSWORD_CHANGE_REQUIRED"));
        mockMvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.role").value("WORKER"))
                .andExpect(jsonPath("$.permissions.EVENTS").value("PUBLISH"));

        mockMvc.perform(post("/api/v1/users/me/password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"MiClaveNueva2026\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/admin/events").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        // Las demás sesiones (refresh tokens anteriores) quedan cerradas.
        mockMvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + tokens.get("refreshToken").asText() + "\"}"))
                .andExpect(status().isUnauthorized());
        login(user.getEmail(), "MiClaveNueva2026");
    }

    @Test
    void wrongCurrentPasswordOrWeakNewPasswordIsRejected() throws Exception {
        User user = worker(false);
        String token = login(user.getEmail(), PASSWORD).get("accessToken").asText();

        mockMvc.perform(post("/api/v1/users/me/password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"incorrecta\",\"newPassword\":\"MiClaveNueva2026\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/users/me/password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"corta\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void disabledAccountIsRejectedImmediatelyEvenWithAValidToken() throws Exception {
        User user = worker(false);
        String token = login(user.getEmail(), PASSWORD).get("accessToken").asText();
        mockMvc.perform(get("/api/v1/admin/events").header("Authorization", "Bearer " + token)).andExpect(status().isOk());

        jdbc.update("UPDATE identity.users SET status = 'DISABLED' WHERE id = ?", user.getId());

        mockMvc.perform(get("/api/v1/admin/events").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        assertThat(userRepository.findById(user.getId())).isPresent();
    }
}
