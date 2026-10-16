package pe.plataformacontenidos.security;

import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.permission.TestProfile;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.ObjectMapper;

/**
 * Test de seguridad (OWASP A01 Broken Access Control): matriz endpoint x rol.
 * Es la contraparte ejecutable de SecurityConfig — si alguien relaja una regla
 * o agrega un endpoint admin sin protegerlo, esto falla antes de llegar a
 * producción. Solo mira el código de estado de autorización (401/403 vs.
 * "pasó la puerta"); la lógica de negocio la cubren los tests de cada módulo.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AuthorizationMatrixIntegrationTest {

    private static final String PASSWORD = "SomeStrongPassword123!";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkerPermissionRepository workerPermissions;
    @Autowired private PasswordEncoder passwordEncoder;

    private String creatorToken;
    private String publisherToken;
    private String adminToken;
    private String ownerToken;

    @BeforeAll
    void createUsers() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        creatorToken = createUserAndLogin("matrix-creador-" + suffix + "@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        publisherToken = createUserAndLogin("matrix-publicador-" + suffix + "@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        adminToken = createUserAndLogin("matrix-admin-" + suffix + "@plataforma-contenidos.test", TestProfile.PUBLICADOR_CON_PUBLICIDAD);
        ownerToken = createUserAndLogin("matrix-owner-" + suffix + "@plataforma-contenidos.test", TestProfile.DUENO);
    }

    /** Endpoints exclusivos del dueño (spec 2a: usuarios/trabajadores, configuración, auditoría). */
    static Stream<String> adminOnlyEndpoints() {
        return Stream.of("/api/v1/admin/workers", "/api/v1/admin/audit", "/api/v1/admin/platform-settings");
    }

    /** Endpoints de gestión que exigen un módulo de gestión (Publicador sí, Creador no). */
    static Stream<String> publisherEndpoints() {
        return Stream.of("/api/v1/admin/categories", "/api/v1/admin/stats");
    }

    /** Endpoints de contenido a los que llega cualquier miembro del equipo (Creador incluido). */
    static Stream<String> creatorEndpoints() {
        return Stream.of("/api/v1/admin/publications", "/api/v1/admin/images", "/api/v1/admin/places",
                "/api/v1/admin/celebrations", "/api/v1/admin/galleries", "/api/v1/admin/directory");
    }

    static Stream<Arguments> everyAdminEndpoint() {
        return Stream.concat(Stream.concat(adminOnlyEndpoints(), publisherEndpoints()), creatorEndpoints()).map(Arguments::of);
    }

    static Stream<String> unknownPaths() {
        return Stream.of("/api/v1/does-not-exist", "/actuator/env", "/actuator/beans", "/api/v2/publications");
    }

    static Stream<String> publicReadOnlyCollections() {
        return Stream.of("/api/v1/publications", "/api/v1/places", "/api/v1/celebrations", "/api/v1/galleries",
                "/api/v1/directory", "/api/v1/categories");
    }

    // Contrato vigente: sin entry point de autenticación configurado, Spring
    // responde 403 (no 401) tanto a anónimos como a tokens inválidos. El
    // frontend depende de eso (lib/admin/auth.ts trata 403 como sesión
    // inválida). Cambiarlo a 401 es una decisión de API que arrastra al
    // frontend, no se toma desde un test.
    @ParameterizedTest(name = "anónimo -> {0} = 403")
    @MethodSource("everyAdminEndpoint")
    void anonymousIsRejectedOnEveryAdminEndpoint(String path) throws Exception {
        mockMvc.perform(get(path)).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "token inválido -> {0} = 403")
    @MethodSource("everyAdminEndpoint")
    void malformedTokenIsRejected(String path) throws Exception {
        mockMvc.perform(get(path).header("Authorization", "Bearer not.a.jwt")).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "CREADOR -> {0} = 403")
    @MethodSource("adminOnlyEndpoints")
    void creatorCannotReachAdminOnlyEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), creatorToken)).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "PUBLICADOR -> {0} = 403")
    @MethodSource("adminOnlyEndpoints")
    void publisherCannotReachAdminOnlyEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), publisherToken)).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "CREADOR -> {0} = 403")
    @MethodSource("publisherEndpoints")
    void creatorCannotReachPublisherEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), creatorToken)).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "PUBLICADOR -> {0} pasa la puerta")
    @MethodSource("publisherEndpoints")
    void publisherPassesPublisherEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), publisherToken)).andExpect(passedAuthorization());
    }

    @ParameterizedTest(name = "CREADOR -> {0} pasa la puerta")
    @MethodSource("creatorEndpoints")
    void creatorPassesContentEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), creatorToken)).andExpect(passedAuthorization());
    }

    @ParameterizedTest(name = "ADMIN (trabajador) -> {0} = 403")
    @MethodSource("adminOnlyEndpoints")
    void adminWorkerCannotReachOwnerOnlyEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), adminToken)).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "dueño -> {0} pasa la puerta")
    @MethodSource("everyAdminEndpoint")
    void ownerPassesEveryAdminEndpoint(String path) throws Exception {
        mockMvc.perform(withToken(get(path), ownerToken)).andExpect(passedAuthorization());
    }

    @ParameterizedTest(name = "ruta desconocida {0} = deny-by-default")
    @MethodSource("unknownPaths")
    void unknownPathsAreDeniedByDefault(String path) throws Exception {
        // anyRequest().denyAll(): una ruta que no existe no debe filtrar ni siquiera un 404 informativo a un anónimo.
        mockMvc.perform(get(path)).andExpect(status().isForbidden());
        mockMvc.perform(withToken(get(path), adminToken)).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "escritura pública sin token en {0} = 403")
    @MethodSource("publicReadOnlyCollections")
    void publicCollectionsAreReadOnlyForAnonymous(String path) throws Exception {
        mockMvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    private static MockHttpServletRequestBuilder withToken(MockHttpServletRequestBuilder builder, String token) {
        return builder.header("Authorization", "Bearer " + token);
    }

    /** "Pasó la puerta" = cualquier cosa menos 401/403. Un GET a un listado vacío puede dar 200 o 400 por params, ambos válidos acá. */
    private static ResultMatcher passedAuthorization() {
        return result -> {
            int status = result.getResponse().getStatus();
            if (status == 401 || status == 403) {
                throw new AssertionError("Esperaba pasar la autorización pero obtuvo " + status);
            }
        };
    }

    private String createUserAndLogin(String email, TestProfile role) throws Exception {
        User created = userRepository.save(new User(email, passwordEncoder.encode(PASSWORD), "Matrix", "Test", role.toRole()));
        role.grant(workerPermissions, created.getId());
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
