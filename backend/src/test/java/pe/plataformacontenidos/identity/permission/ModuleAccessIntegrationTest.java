package pe.plataformacontenidos.identity.permission;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.ObjectMapper;

/** Spec 2a, criterios 1 y 4: sin permiso → 403 en el panel; quitarlo rige en la siguiente petición. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class ModuleAccessIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkerPermissionRepository permissions;
    @Autowired private PasswordEncoder passwordEncoder;

    @ParameterizedTest(name = "{0} {1}")
    @CsvSource({
        "ARTICLES, /api/v1/admin/articles, CREATE",
        "PLACES, /api/v1/admin/places, CREATE",
        "EVENTS, /api/v1/admin/events, CREATE",
        "GALLERIES, /api/v1/admin/galleries, CREATE",
        "DIRECTORY, /api/v1/admin/directory, CREATE",
        "CATEGORIES, /api/v1/admin/categories, ACCESS",
        "STATS, /api/v1/admin/stats, ACCESS",
        "ADVERTISING, /api/v1/admin/advertisers, ACCESS",
    })
    void moduleIsRequiredAndRevocationIsImmediate(Module module, String path, AccessLevel level) throws Exception {
        String email = "worker-" + UUID.randomUUID() + "@perm.test";
        User worker = userRepository.save(new User(email, passwordEncoder.encode("ClaveSegura12345"), "T", "W", Role.AUTHOR));
        String token = login(email);

        mockMvc.perform(get(path).header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("MODULE_ACCESS_DENIED"));

        permissions.save(new WorkerPermission(worker.getId(), module, level));
        mockMvc.perform(get(path).header("Authorization", "Bearer " + token)).andExpect(status().isOk());

        permissions.deleteById(new WorkerPermission.Key(worker.getId(), module));
        mockMvc.perform(get(path).header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private String login(String email) throws Exception {
        var result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"ClaveSegura12345\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
