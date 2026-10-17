package pe.plataformacontenidos.shared.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
import org.springframework.test.web.servlet.ResultActions;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import pe.plataformacontenidos.identity.permission.TestProfile;
import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import tools.jackson.databind.ObjectMapper;

/**
 * Todos los errores de la API en un solo formato, RFC 9457 (application/problem+json):
 * los de cada módulo, los de Spring MVC y los de los filtros de seguridad.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ProblemDetailIntegrationTest {

    private static final String PASSWORD = "SomeStrongPassword123!";

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
    void aModuleErrorIsAProblemDetailWithItsPath() throws Exception {
        expectProblem(mockMvc.perform(get("/api/v1/publications/no-existe-esta-publicacion")), 404, "No encontrado")
                .andExpect(jsonPath("$.instance").value("/api/v1/publications/no-existe-esta-publicacion"));
    }

    @Test
    void anInvalidParameterSaysWhichOne() throws Exception {
        expectProblem(mockMvc.perform(get("/api/v1/feed").param("type", "NO_EXISTE")), 400, "Solicitud inválida");
        String token = login("problemas-parametro@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        expectProblem(mockMvc.perform(get("/api/v1/admin/publications").param("status", "NO_EXISTE")
                        .header("Authorization", "Bearer " + token)), 400, "Solicitud inválida")
                .andExpect(jsonPath("$.detail").value("Parámetro inválido: status"));
    }

    @Test
    void validationListsEachField() throws Exception {
        String token = login("problemas-validacion@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        expectProblem(mockMvc.perform(post("/api/v1/admin/celebrations").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"\",\"body\":\"Texto.\"}")),
                400, "Solicitud inválida")
                .andExpect(jsonPath("$.detail").value("Revisa los datos enviados."))
                .andExpect(jsonPath("$.errors[?(@.field == 'title')].message").exists())
                .andExpect(jsonPath("$.errors[?(@.field == 'categoryId')].message").value("no debe ser nulo"));
    }

    @Test
    void malformedJsonIsABadRequestInSpanish() throws Exception {
        String token = login("problemas-json@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        expectProblem(mockMvc.perform(post("/api/v1/admin/celebrations").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{no es json")), 400, "Solicitud inválida")
                .andExpect(jsonPath("$.detail").value(
                        "No se pudo leer la solicitud: revisa que los datos tengan el formato correcto."));
    }

    @Test
    void permissionErrorsKeepTheirStableCode() throws Exception {
        String token = login("problemas-sin-modulo@plataforma-contenidos.test", TestProfile.SIN_PERMISOS);
        expectProblem(mockMvc.perform(get("/api/v1/admin/publications").header("Authorization", "Bearer " + token)),
                403, "Sin permiso")
                .andExpect(jsonPath("$.code").value("MODULE_ACCESS_DENIED"));
    }

    @Test
    void securityResponsesUseTheSameFormat() throws Exception {
        // Sin sesión: 403 (el panel lo trata como «vuelve a iniciar sesión»).
        expectProblem(mockMvc.perform(get("/api/v1/admin/publications")), 403, "Sin permiso")
                .andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
        // Con sesión, en una ruta solo del dueño.
        String token = login("problemas-dueno@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        expectProblem(mockMvc.perform(get("/api/v1/admin/audit").header("Authorization", "Bearer " + token)),
                403, "Sin permiso")
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private ResultActions expectProblem(ResultActions result, int status, String title) throws Exception {
        return result.andExpect(status().is(status))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value(title))
                .andExpect(jsonPath("$.status").value(status))
                .andExpect(jsonPath("$.detail").isString());
    }

    private String login(String email, TestProfile profile) throws Exception {
        User user = userRepository.save(new User(email, passwordEncoder.encode(PASSWORD), "Test", "User", profile.toRole()));
        profile.grant(workerPermissions, user.getId());
        String body = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("accessToken").asText();
    }
}
