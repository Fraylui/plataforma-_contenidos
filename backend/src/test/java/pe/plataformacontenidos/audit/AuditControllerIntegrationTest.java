package pe.plataformacontenidos.audit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** CONTEXTO.md secciones 18 y 35.3 (fase 1): consulta del audit log desde el panel admin. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class AuditControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Test
    void adminCanFilterAuditLogByResourceTypeAndResult() throws Exception {
        String adminToken = createUserAndLogin("audit-admin@plataforma-contenidos.test", Role.ADMIN);

        auditService.record("TEST_ACTION_A", AuditResult.SUCCESS, null, "someone@test", "widget", "1", "127.0.0.1");
        auditService.record("TEST_ACTION_B", AuditResult.FAILURE, null, "someone@test", "gadget", "2", "127.0.0.1");

        mockMvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("resourceType", "widget")
                        .param("result", "SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].action").value("TEST_ACTION_A"))
                .andExpect(jsonPath("$.items", org.hamcrest.Matchers.hasSize(1)));
    }

    @Test
    void loginSuccessIsRecordedAndVisibleToAdmin() throws Exception {
        String adminToken = createUserAndLogin("audit-admin-2@plataforma-contenidos.test", Role.ADMIN);
        createUserAndLogin("audit-target@plataforma-contenidos.test", Role.AUTHOR);

        mockMvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("actorEmail", "audit-target@plataforma-contenidos.test")
                        .param("action", "LOGIN_SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.items[0].result").value("SUCCESS"));
    }

    @Test
    void editorCannotAccessAuditLog() throws Exception {
        String editorToken = createUserAndLogin("audit-editor@plataforma-contenidos.test", Role.EDITOR);

        mockMvc.perform(get("/api/v1/admin/audit").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedCannotAccessAuditLog() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit")).andExpect(status().isForbidden());
    }

    private String textField(MvcResult result, String field) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get(field).asText();
    }

    private String createUserAndLogin(String email, Role role) throws Exception {
        String password = "SomeStrongPassword123!";
        userRepository.save(new User(email, passwordEncoder.encode(password), "Test User", role));

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return textField(result, "accessToken");
    }
}
