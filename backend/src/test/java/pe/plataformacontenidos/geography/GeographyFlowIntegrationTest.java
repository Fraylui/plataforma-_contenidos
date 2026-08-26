package pe.plataformacontenidos.geography;

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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class GeographyFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void buildsFullHierarchyAndExposesItPublicly() throws Exception {
        String editorToken = createUserAndLogin("geo-editor@plataforma-contenidos.test", Role.EDITOR);
        String authorToken = createUserAndLogin("geo-author@plataforma-contenidos.test", Role.AUTHOR);

        mockMvc.perform(post("/api/v1/admin/geography")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Perú\",\"level\":\"PAIS\"}"))
                .andExpect(status().isForbidden());

        String peruId = createUnit(editorToken, "Perú", "PAIS", null);
        String ayacuchoId = createUnit(editorToken, "Ayacucho", "REGION", peruId);
        String huamangaId = createUnit(editorToken, "Huamanga", "PROVINCIA", ayacuchoId);
        createUnit(editorToken, "Quinua", "DISTRITO", huamangaId);

        mockMvc.perform(get("/api/v1/geography"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.slug == 'peru')]").exists());

        mockMvc.perform(get("/api/v1/geography").param("parentId", peruId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Ayacucho"))
                .andExpect(jsonPath("$[0].level").value("REGION"));

        mockMvc.perform(get("/api/v1/geography").param("parentId", ayacuchoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Huamanga"));
    }

    @Test
    void rejectsChildOfWrongParentLevel() throws Exception {
        String editorToken = createUserAndLogin("geo-editor-2@plataforma-contenidos.test", Role.EDITOR);
        String peruId = createUnit(editorToken, "Perú Dos", "PAIS", null);

        // Un DISTRITO no puede colgar directo de un PAIS: se salta PROVINCIA
        mockMvc.perform(post("/api/v1/admin/geography")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Quinua Suelto\",\"level\":\"DISTRITO\",\"parentId\":\"" + peruId + "\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void regionRequiresAParent() throws Exception {
        String editorToken = createUserAndLogin("geo-editor-3@plataforma-contenidos.test", Role.EDITOR);

        mockMvc.perform(post("/api/v1/admin/geography")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Región huérfana\",\"level\":\"REGION\"}"))
                .andExpect(status().isConflict());
    }

    private String createUnit(String editorToken, String name, String level, String parentId) throws Exception {
        String parentField = parentId == null ? "" : ",\"parentId\":\"" + parentId + "\"";
        MvcResult result = mockMvc.perform(post("/api/v1/admin/geography")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"level\":\"" + level + "\"" + parentField + "}"))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asText();
    }

    private String createUserAndLogin(String email, Role role) throws Exception {
        String password = "SomeStrongPassword123!";
        userRepository.save(new User(email, passwordEncoder.encode(password), "Test User", role));

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
