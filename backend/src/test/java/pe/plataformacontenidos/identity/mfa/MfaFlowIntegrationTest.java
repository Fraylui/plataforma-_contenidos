package pe.plataformacontenidos.identity.mfa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
        "app.security.bootstrap-admin-email=mfa-admin@plataforma-contenidos.test",
        "app.security.bootstrap-admin-password=Sup3rSecret!Password"
})
class MfaFlowIntegrationTest {

    private static final String ADMIN_EMAIL = "mfa-admin@plataforma-contenidos.test";
    private static final String ADMIN_PASSWORD = "Sup3rSecret!Password";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TotpService totpService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Deliberadamente NO usa el admin bootstrapeado por @TestPropertySource:
     * ese usuario es compartido entre los métodos de esta clase (mismo
     * contexto Spring, misma base de datos, sin rollback entre tests), y el
     * otro test lo deja con MFA habilitado. Un usuario propio con email
     * único evita que el orden de ejecución de los tests afecte el resultado.
     */
    @Test
    void loginWithoutMfaEnabledSucceedsButFlagsSetupRequired() throws Exception {
        String email = "fresh-super-admin@plataforma-contenidos.test";
        String password = "AnotherSup3rSecret!";
        userRepository.save(new User(email, passwordEncoder.encode(password), "Fresh Admin", Role.SUPER_ADMIN));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaSetupRequired").value(true));
    }

    @Test
    void fullEnrollmentAndLoginEnforcementFlow() throws Exception {
        String accessToken = login(ADMIN_EMAIL, ADMIN_PASSWORD, null);

        // Antes de enrolar, /users/me y el listado admin deben reflejar mfaEnabled=false.
        mockMvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaEnabled").value(false));

        // 1. Enroll: obtiene el secreto (vía la URI de aprovisionamiento)
        MvcResult enrollResult = mockMvc.perform(post("/api/v1/users/me/mfa/enroll")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andReturn();
        byte[] secret = extractSecret(enrollResult);

        // 2. Confirmar con un código válido habilita MFA y devuelve códigos de respaldo
        String validCode = totpService.generateCode(secret, System.currentTimeMillis() / 1000 / 30);
        MvcResult confirmResult = mockMvc.perform(post("/api/v1/users/me/mfa/confirm")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + validCode + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.backupCodes.length()").value(10))
                .andReturn();
        String backupCode = objectMapper.readTree(confirmResult.getResponse().getContentAsString())
                .get("backupCodes").get(0).asText();

        // Después de confirmar, tanto /users/me como el listado admin deben reflejar mfaEnabled=true.
        mockMvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaEnabled").value(true));
        mockMvc.perform(get("/api/v1/admin/users").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email == '" + ADMIN_EMAIL + "')].mfaEnabled").value(true));

        // 3. Login sin código MFA ahora falla (401), aunque la password sea correcta
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_EMAIL, ADMIN_PASSWORD, null)))
                .andExpect(status().isUnauthorized());

        // 4. Login con TOTP válido funciona y ya no marca mfaSetupRequired
        String freshCode = totpService.generateCode(secret, System.currentTimeMillis() / 1000 / 30);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_EMAIL, ADMIN_PASSWORD, freshCode)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaSetupRequired").value(false));

        // 5. Un código de respaldo funciona una sola vez
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_EMAIL, ADMIN_PASSWORD, backupCode)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(ADMIN_EMAIL, ADMIN_PASSWORD, backupCode)))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Regresión del gap encontrado en la Fase 1 del panel admin: antes,
     * POST /mfa/enroll reemplazaba el secreto activo (deshabilitando MFA de
     * inmediato) con solo un access token válido, sin probar el código MFA
     * actual — un access token robado (15 min de vida) bastaba para
     * desactivar el MFA "obligatorio" de un SUPER_ADMIN. Ver
     * MfaService.startEnrollment.
     */
    @Test
    void reEnrollmentRequiresCurrentMfaCodeAndDoesNotDisableMfaWithoutIt() throws Exception {
        String email = "mfa-rotation@plataforma-contenidos.test";
        String password = "RotationSecret!123";
        userRepository.save(new User(email, passwordEncoder.encode(password), "Rotation Test", Role.SUPER_ADMIN));
        String accessToken = login(email, password, null);

        byte[] originalSecret = enrollAndConfirm(accessToken);

        // Re-enrolar SIN el código actual debe fallar...
        mockMvc.perform(post("/api/v1/users/me/mfa/enroll")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest());

        // ...y el MFA activo NO debe quedar deshabilitado por el intento fallido.
        mockMvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaEnabled").value(true));

        // El secreto original sigue siendo el vigente: un login con él todavía funciona.
        String stillValidCode = totpService.generateCode(originalSecret, System.currentTimeMillis() / 1000 / 30);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password, stillValidCode)))
                .andExpect(status().isOk());

        // Re-enrolar CON el código actual sí funciona y rota a un secreto distinto.
        String rotationCode = totpService.generateCode(originalSecret, System.currentTimeMillis() / 1000 / 30);
        MvcResult reEnrollResult = mockMvc.perform(post("/api/v1/users/me/mfa/enroll")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentCode\":\"" + rotationCode + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        byte[] newSecret = extractSecret(reEnrollResult);
        assertThat(newSecret).isNotEqualTo(originalSecret);

        // Regresión adicional (encontrada en la revisión de código de esta
        // fase): la rotación recién iniciada (con currentCode válido) NO
        // debe deshabilitar MFA ni tocar el secreto activo hasta que se
        // CONFIRME el nuevo — si el usuario abandona acá, debe seguir
        // protegido con el secreto original.
        mockMvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaEnabled").value(true));
        String originalStillWorks = totpService.generateCode(originalSecret, System.currentTimeMillis() / 1000 / 30);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password, originalStillWorks)))
                .andExpect(status().isOk());
        String pendingSecretDoesNotWorkYet = totpService.generateCode(newSecret, System.currentTimeMillis() / 1000 / 30);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password, pendingSecretDoesNotWorkYet)))
                .andExpect(status().isUnauthorized());

        // Confirmar la rotación con el secreto pendiente promueve recién ahí el nuevo secreto.
        String confirmRotationCode = totpService.generateCode(newSecret, System.currentTimeMillis() / 1000 / 30);
        mockMvc.perform(post("/api/v1/users/me/mfa/confirm")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + confirmRotationCode + "\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaEnabled").value(true));
        String newSecretNowWorks = totpService.generateCode(newSecret, System.currentTimeMillis() / 1000 / 30);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password, newSecretNowWorks)))
                .andExpect(status().isOk());
        String oldSecretNoLongerWorks = totpService.generateCode(originalSecret, System.currentTimeMillis() / 1000 / 30);
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password, oldSecretNoLongerWorks)))
                .andExpect(status().isUnauthorized());
    }

    /** Enrola y confirma MFA para el usuario del token dado; devuelve el secreto TOTP resultante. */
    private byte[] enrollAndConfirm(String accessToken) throws Exception {
        MvcResult enrollResult = mockMvc.perform(post("/api/v1/users/me/mfa/enroll")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andReturn();
        byte[] secret = extractSecret(enrollResult);
        String confirmCode = totpService.generateCode(secret, System.currentTimeMillis() / 1000 / 30);
        mockMvc.perform(post("/api/v1/users/me/mfa/confirm")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + confirmCode + "\"}"))
                .andExpect(status().isOk());
        return secret;
    }

    private byte[] extractSecret(MvcResult enrollResult) throws Exception {
        var json = objectMapper.readTree(enrollResult.getResponse().getContentAsString());
        String uri = json.get("provisioningUri").asText();
        String query = URI.create(uri).getRawQuery();
        for (String param : query.split("&")) {
            String[] kv = param.split("=", 2);
            if (kv[0].equals("secret")) {
                String base32 = URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                return Base32.decode(base32);
            }
        }
        throw new IllegalStateException("secret no encontrado en la URI de aprovisionamiento");
    }

    private String login(String email, String password, String mfaCode) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, password, mfaCode)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private String loginJson(String email, String password, String mfaCode) {
        String mfaField = mfaCode == null ? "null" : "\"" + mfaCode + "\"";
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"mfaCode\":" + mfaField + "}";
    }
}
