package pe.plataformacontenidos.identity.permission;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class PermissionServiceIntegrationTest {

    @Autowired private PermissionService permissionService;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkerPermissionRepository repository;
    @Autowired private JdbcTemplate jdbc;

    private User user(Role role) {
        return userRepository.save(new User(UUID.randomUUID() + "@perm.test", "x", "A", "B", role));
    }

    @Test
    void superAdminIsTheOwner() {
        assertThat(permissionService.forUser(user(Role.OWNER).getId()).owner()).isTrue();
    }

    @Test
    void workerPermissionsComeFromItsRows() {
        User worker = user(Role.WORKER);
        repository.save(new WorkerPermission(worker.getId(), Module.EVENTS, AccessLevel.PUBLISH));

        Permissions p = permissionService.forUser(worker.getId());
        assertThat(p.owner()).isFalse();
        assertThat(p.canPublish(Module.EVENTS)).isTrue();
        assertThat(p.can(Module.ARTICLES, AccessLevel.CREATE)).isFalse();
    }

    @Test
    void databaseRejectsInvalidModuleLevelCombinations() {
        User worker = user(Role.WORKER);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO identity.worker_permissions (user_id, module, level) VALUES (?, 'CATEGORIES', 'PUBLISH')", worker.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO identity.worker_permissions (user_id, module, level) VALUES (?, 'EVENTS', 'ACCESS')", worker.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
