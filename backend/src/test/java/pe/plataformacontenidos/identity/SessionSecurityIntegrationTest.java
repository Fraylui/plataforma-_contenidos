package pe.plataformacontenidos.identity;

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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.places.api.PlaceOptionsController;
import pe.plataformacontenidos.identity.permission.WorkerPermission;
import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Hallazgos de la revisión final de 2a: sesiones al cambiar/restablecer contraseña, límite de intentos y opciones de lugar. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class SessionSecurityIntegrationTest {

    private static final String PASSWORD = "ClaveInicial12345";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkerPermissionRepository permissions;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private StringRedisTemplate redis;

    private User user(Role role) {
        return userRepository.save(new User(UUID.randomUUID() + "@session.test", passwordEncoder.encode(PASSWORD), "S", "T", role));
    }

    private JsonNode login(String email, String password) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private int refreshStatus(String refreshToken) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andReturn().getResponse().getStatus();
    }

    private org.springframework.test.web.servlet.ResultActions changePassword(String accessToken, String current, String next) throws Exception {
        return mockMvc.perform(post("/api/v1/users/me/password").header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"" + current + "\",\"newPassword\":\"" + next + "\"}"));
    }

    /** Hallazgo 1: cambiar la contraseña no debe cerrar la sesión de quien la cambia. */
    @Test
    void changingThePasswordKeepsTheCurrentSessionAndClosesTheOthers() throws Exception {
        User worker = user(Role.WORKER);
        JsonNode sessionA = login(worker.getEmail(), PASSWORD);
        JsonNode sessionB = login(worker.getEmail(), PASSWORD);

        var result = changePassword(sessionA.get("accessToken").asText(), PASSWORD, "ClaveNuevaSegura2026")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").isString())
                .andReturn();
        String newRefresh = objectMapper.readTree(result.getResponse().getContentAsString()).get("refreshToken").asText();

        org.assertj.core.api.Assertions.assertThat(refreshStatus(sessionA.get("refreshToken").asText())).isEqualTo(401);
        org.assertj.core.api.Assertions.assertThat(refreshStatus(sessionB.get("refreshToken").asText())).isEqualTo(401);
        org.assertj.core.api.Assertions.assertThat(refreshStatus(newRefresh)).isEqualTo(200);
    }

    /** Hallazgo 3: sesiones creadas antes del índice por usuario (o en plena carrera) también caen al restablecer. */
    @Test
    void resetInvalidatesSessionsThatAreNotInThePerUserIndex() throws Exception {
        User owner = user(Role.OWNER);
        String ownerToken = login(owner.getEmail(), PASSWORD).get("accessToken").asText();
        User worker = user(Role.WORKER);
        String oldRefresh = login(worker.getEmail(), PASSWORD).get("refreshToken").asText();
        redis.delete("refresh_tokens_of:" + worker.getId()); // como un token emitido antes de este cambio

        mockMvc.perform(post("/api/v1/admin/workers/" + worker.getId() + "/reset-password").header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        org.assertj.core.api.Assertions.assertThat(refreshStatus(oldRefresh)).isEqualTo(401);
    }

    /** Hallazgo 4: adivinar la contraseña actual con un token robado tiene el mismo límite que el login. */
    @Test
    void guessingTheCurrentPasswordIsRateLimited() throws Exception {
        User worker = user(Role.WORKER);
        String token = login(worker.getEmail(), PASSWORD).get("accessToken").asText();
        for (int i = 0; i < 5; i++) {
            changePassword(token, "adivinanza-" + i, "ClaveNuevaSegura2026").andExpect(status().isBadRequest());
        }
        changePassword(token, PASSWORD, "ClaveNuevaSegura2026").andExpect(status().isTooManyRequests());
    }

    /** Hallazgo 2: quien gestiona eventos o directorio elige lugar aunque no tenga el módulo Lugares. */
    @Test
    void placeOptionsAreAvailableToEventsOrDirectoryWorkers() throws Exception {
        User eventsOnly = user(Role.WORKER);
        permissions.save(new WorkerPermission(eventsOnly.getId(), Module.EVENTS, AccessLevel.PUBLISH));
        String token = login(eventsOnly.getEmail(), PASSWORD).get("accessToken").asText();
        mockMvc.perform(get(PlaceOptionsController.PATH).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        User nothing = user(Role.WORKER);
        String noAccess = login(nothing.getEmail(), PASSWORD).get("accessToken").asText();
        mockMvc.perform(get(PlaceOptionsController.PATH).header("Authorization", "Bearer " + noAccess))
                .andExpect(status().isForbidden());
    }
}
