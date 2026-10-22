package pe.plataformacontenidos.identity;

import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.test.web.servlet.ResultActions;
import pe.plataformacontenidos.TestcontainersConfiguration;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Spec 2a §5–§7: alta, permisos, restablecer y desactivar trabajadores (solo el dueño). */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class WorkerAdminIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JdbcTemplate jdbc;

    private User owner;
    private String ownerToken;

    @BeforeEach
    void owner() throws Exception {
        owner = TestOwner.ensure(userRepository, passwordEncoder);
        ownerToken = TestOwner.login(mockMvc, userRepository, passwordEncoder);
    }

    private JsonNode login(String email, String password) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private ResultActions as(String token, org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private JsonNode createWorker(String permissionsJson) throws Exception {
        String email = UUID.randomUUID() + "@worker.test";
        var result = as(ownerToken, post("/api/v1/admin/workers").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"firstName\":\"Ana\",\"lastName\":\"Pérez\",\"permissions\":" + permissionsJson + "}"))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private String lastAuditDetails(String action, String resourceId) {
        return jdbc.queryForObject("SELECT details FROM audit.audit_log WHERE action = ? AND resource_id = ? ORDER BY occurred_at DESC LIMIT 1",
                String.class, action, resourceId);
    }

    private int auditCount(String action, String resourceId) {
        return jdbc.queryForObject("SELECT count(*) FROM audit.audit_log WHERE action = ? AND resource_id = ?", Integer.class, action, resourceId);
    }

    @Test
    void createdWorkerGetsATemporaryPasswordShownOnce() throws Exception {
        JsonNode created = createWorker("{\"CELEBRATIONS\":\"PUBLISH\",\"PLACES\":\"PUBLISH\"}");
        String password = created.get("temporaryPassword").asText();
        String id = created.get("worker").get("id").asText();

        assertThat(password).hasSize(20).matches("[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789]{20}");
        assertThat(created.get("worker").get("mustChangePassword").asBoolean()).isTrue();
        assertThat(created.get("worker").get("permissions").get("CELEBRATIONS").asText()).isEqualTo("PUBLISH");
        assertThat(auditCount("WORKER_CREATED", id)).isEqualTo(1);
        login(created.get("worker").get("email").asText(), password);

        as(ownerToken, get("/api/v1/admin/workers")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + id + "')].email").exists())
                .andExpect(jsonPath("$[?(@.id == '" + id + "')].temporaryPassword").doesNotExist());
    }

    @Test
    void permissionChangesAreAuditedBeforeAndAfter() throws Exception {
        String id = createWorker("{\"ADVERTISING\":\"ACCESS\"}").get("worker").get("id").asText();

        as(ownerToken, put("/api/v1/admin/workers/" + id + "/permissions").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"permissions\":{\"CELEBRATIONS\":\"PUBLISH\"}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permissions.CELEBRATIONS").value("PUBLISH"))
                .andExpect(jsonPath("$.permissions.ADVERTISING").doesNotExist());

        assertThat(lastAuditDetails("WORKER_PERMISSIONS_CHANGED", id)).isEqualTo("CELEBRATIONS: — → PUBLISH; ADVERTISING: ACCESS → —");
    }

    @Test
    void invalidModuleLevelCombinationIsRejected() throws Exception {
        String id = createWorker("{}").get("worker").get("id").asText();
        as(ownerToken, put("/api/v1/admin/workers/" + id + "/permissions").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"permissions\":{\"CATEGORIES\":\"PUBLISH\"}}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resetGivesANewTemporaryPasswordAndClosesSessions() throws Exception {
        JsonNode created = createWorker("{\"CELEBRATIONS\":\"PUBLISH\"}");
        String id = created.get("worker").get("id").asText();
        String email = created.get("worker").get("email").asText();
        String oldRefresh = login(email, created.get("temporaryPassword").asText()).get("refreshToken").asText();

        var result = as(ownerToken, post("/api/v1/admin/workers/" + id + "/reset-password")).andExpect(status().isOk()).andReturn();
        String newPassword = objectMapper.readTree(result.getResponse().getContentAsString()).get("temporaryPassword").asText();

        mockMvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + oldRefresh + "\"}"))
                .andExpect(status().isUnauthorized());
        login(email, newPassword);
        assertThat(auditCount("WORKER_PASSWORD_RESET", id)).isEqualTo(1);
    }

    @Test
    void deactivateAndActivate() throws Exception {
        JsonNode created = createWorker("{\"CELEBRATIONS\":\"PUBLISH\"}");
        String id = created.get("worker").get("id").asText();
        String email = created.get("worker").get("email").asText();
        String password = created.get("temporaryPassword").asText();

        as(ownerToken, post("/api/v1/admin/workers/" + id + "/deactivate")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISABLED"));
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isUnauthorized());
        as(ownerToken, post("/api/v1/admin/workers/" + id + "/activate")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        login(email, password);
        assertThat(auditCount("WORKER_DEACTIVATED", id)).isEqualTo(1);
        assertThat(auditCount("WORKER_ACTIVATED", id)).isEqualTo(1);
    }

    @Test
    void theOwnerCannotBeManagedFromHere() throws Exception {
        String ownerId = owner.getId().toString();
        as(ownerToken, post("/api/v1/admin/workers/" + ownerId + "/deactivate"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("OWNER_MANAGEMENT_DENIED"));
        as(ownerToken, post("/api/v1/admin/workers/" + ownerId + "/reset-password"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("OWNER_MANAGEMENT_DENIED"));
        as(ownerToken, put("/api/v1/admin/workers/" + ownerId + "/permissions").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"permissions\":{}}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("OWNER_MANAGEMENT_DENIED"));
    }

    @Test
    void workersCannotManageWorkers() throws Exception {
        JsonNode created = createWorker("{\"CELEBRATIONS\":\"PUBLISH\"}");
        String email = created.get("worker").get("email").asText();
        String token = login(email, created.get("temporaryPassword").asText()).get("accessToken").asText();
        mockMvc.perform(post("/api/v1/users/me/password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"" + created.get("temporaryPassword").asText() + "\",\"newPassword\":\"ClaveDeAna2026!\"}"))
                .andExpect(status().isOk());

        as(token, get("/api/v1/admin/workers")).andExpect(status().isForbidden());
    }

    /** Administrador (plantilla ADMINISTRADOR): todo lo del dueño menos la auditoría, y nunca la cuenta del dueño. */
    @Test
    void administratorRunsThePlatformButNotTheAuditNorTheOwner() throws Exception {
        JsonNode created = createWorker("""
                {"PUBLICATIONS":"PUBLISH","PLACES":"PUBLISH","CELEBRATIONS":"PUBLISH","GALLERIES":"PUBLISH","SERIES":"PUBLISH",
                 "CATEGORIES":"ACCESS","STATS":"ACCESS","ADVERTISING":"ACCESS","WORKERS":"ACCESS","SETTINGS":"ACCESS"}""");
        String email = created.get("worker").get("email").asText();
        String token = login(email, created.get("temporaryPassword").asText()).get("accessToken").asText();
        mockMvc.perform(post("/api/v1/users/me/password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"" + created.get("temporaryPassword").asText() + "\",\"newPassword\":\"ClaveDeAdmin2026!\"}"))
                .andExpect(status().isOk());

        as(token, get("/api/v1/admin/workers")).andExpect(status().isOk());
        as(token, post("/api/v1/admin/workers").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + UUID.randomUUID() + "@worker.test\",\"firstName\":\"Luz\",\"lastName\":\"Rojas\","
                                + "\"permissions\":{\"CELEBRATIONS\":\"PUBLISH\"}}"))
                .andExpect(status().isCreated());
        as(token, get("/api/v1/admin/platform-settings")).andExpect(status().isOk());

        as(token, get("/api/v1/admin/audit")).andExpect(status().isForbidden());
        as(token, post("/api/v1/admin/workers/" + owner.getId() + "/deactivate"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("OWNER_MANAGEMENT_DENIED"));
    }
}
