package pe.plataformacontenidos.security;

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
import pe.plataformacontenidos.identity.Role;
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
    @Autowired private PasswordEncoder passwordEncoder;

    private String authorToken;
    private String editorToken;
    private String adminToken;

    @BeforeAll
    void createUsers() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        authorToken = createUserAndLogin("matrix-author-" + suffix + "@plataforma-contenidos.test", Role.AUTHOR);
        editorToken = createUserAndLogin("matrix-editor-" + suffix + "@plataforma-contenidos.test", Role.EDITOR);
        adminToken = createUserAndLogin("matrix-admin-" + suffix + "@plataforma-contenidos.test", Role.ADMIN);
    }

    /** Endpoints admin que requieren rol ADMIN o SUPER_ADMIN. */
    static Stream<String> adminOnlyEndpoints() {
        return Stream.of("/api/v1/admin/users", "/api/v1/admin/audit", "/api/v1/admin/platform-settings");
    }

    /** Endpoints de gestión que requieren al menos EDITOR (no AUTHOR). */
    static Stream<String> editorEndpoints() {
        return Stream.of("/api/v1/admin/categories", "/api/v1/admin/tags", "/api/v1/admin/stats");
    }

    /** Endpoints de contenido a los que llega cualquier miembro del equipo (AUTHOR incluido). */
    static Stream<String> authorEndpoints() {
        return Stream.of("/api/v1/admin/articles", "/api/v1/admin/images", "/api/v1/admin/places",
                "/api/v1/admin/events", "/api/v1/admin/galleries", "/api/v1/admin/reviews", "/api/v1/admin/directory");
    }

    static Stream<Arguments> everyAdminEndpoint() {
        return Stream.concat(Stream.concat(adminOnlyEndpoints(), editorEndpoints()), authorEndpoints()).map(Arguments::of);
    }

    static Stream<String> unknownPaths() {
        return Stream.of("/api/v1/does-not-exist", "/actuator/env", "/actuator/beans", "/api/v2/articles");
    }

    static Stream<String> publicReadOnlyCollections() {
        return Stream.of("/api/v1/articles", "/api/v1/places", "/api/v1/events", "/api/v1/galleries",
                "/api/v1/reviews", "/api/v1/directory", "/api/v1/categories");
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

    @ParameterizedTest(name = "AUTHOR -> {0} = 403")
    @MethodSource("adminOnlyEndpoints")
    void authorCannotReachAdminOnlyEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), authorToken)).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "EDITOR -> {0} = 403")
    @MethodSource("adminOnlyEndpoints")
    void editorCannotReachAdminOnlyEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), editorToken)).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "AUTHOR -> {0} = 403")
    @MethodSource("editorEndpoints")
    void authorCannotReachEditorEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), authorToken)).andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "EDITOR -> {0} pasa la puerta")
    @MethodSource("editorEndpoints")
    void editorPassesEditorEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), editorToken)).andExpect(passedAuthorization());
    }

    @ParameterizedTest(name = "AUTHOR -> {0} pasa la puerta")
    @MethodSource("authorEndpoints")
    void authorPassesContentEndpoints(String path) throws Exception {
        mockMvc.perform(withToken(get(path), authorToken)).andExpect(passedAuthorization());
    }

    @ParameterizedTest(name = "ADMIN -> {0} pasa la puerta")
    @MethodSource("everyAdminEndpoint")
    void adminPassesEveryAdminEndpoint(String path) throws Exception {
        mockMvc.perform(withToken(get(path), adminToken)).andExpect(passedAuthorization());
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

    private String createUserAndLogin(String email, Role role) throws Exception {
        userRepository.save(new User(email, passwordEncoder.encode(PASSWORD), "Matrix", "Test", role));
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
