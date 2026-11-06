package pe.plataformacontenidos.identity.permission;

import pe.plataformacontenidos.identity.internal.WorkerPermissionRepository;
import pe.plataformacontenidos.identity.internal.WorkerPermission;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.TestOwner;
import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class PermissionServiceIntegrationTest {

    @Autowired private PermissionService permissionService;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private WorkerPermissionRepository repository;
    @Autowired private JdbcTemplate jdbc;

    private User user(Role role) {
        return userRepository.save(new User(UUID.randomUUID() + "@perm.test", "x", "A", "B", role));
    }

    @Test
    void superAdminIsTheOwner() {
        assertThat(permissionService.forUser(TestOwner.ensure(userRepository, passwordEncoder).getId()).owner()).isTrue();
    }

    @Test
    void workerPermissionsComeFromItsRows() {
        User worker = user(Role.WORKER);
        repository.save(new WorkerPermission(worker.getId(), Module.CELEBRATIONS, AccessLevel.PUBLISH));

        Permissions p = permissionService.forUser(worker.getId());
        assertThat(p.owner()).isFalse();
        assertThat(p.can(Module.CELEBRATIONS, AccessLevel.PUBLISH)).isTrue();
        assertThat(p.can(Module.PUBLICATIONS, AccessLevel.PUBLISH)).isFalse();
    }

    @Test
    void databaseRejectsInvalidModuleLevelCombinations() {
        User worker = user(Role.WORKER);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO identity.worker_permissions (user_id, module, level) VALUES (?, 'CATEGORIES', 'PUBLISH')", worker.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO identity.worker_permissions (user_id, module, level) VALUES (?, 'CELEBRATIONS', 'ACCESS')", worker.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
        // V54: el nivel "solo crear" ya no existe.
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO identity.worker_permissions (user_id, module, level) VALUES (?, 'CELEBRATIONS', 'CREATE')", worker.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    /** V66: la plataforma tiene un solo dueño, también a nivel de base. */
    @Test
    void databaseAllowsOnlyOneOwner() {
        TestOwner.ensure(userRepository, passwordEncoder);
        assertThatThrownBy(() -> userRepository.saveAndFlush(
                new User(UUID.randomUUID() + "@segundo-dueno.test", "x", "Otro", "Dueño", Role.OWNER)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
