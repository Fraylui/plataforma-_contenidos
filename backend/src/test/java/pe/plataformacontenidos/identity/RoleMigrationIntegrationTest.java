package pe.plataformacontenidos.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Migraciones de 2a sobre datos como los de producción (spec 2a §11): una
 * base aparte se migra hasta V48, se cargan cuentas con los roles viejos y
 * se aplica el resto. Nadie pierde acceso: el SUPER_ADMIN pasa a dueño y
 * cada rol conserva su alcance como permisos.
 */
class RoleMigrationIntegrationTest {

    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"));
    private static JdbcTemplate jdbc;
    private static Flyway flyway;

    @BeforeAll
    static void migrateWithLegacyAccounts() {
        POSTGRES.start();
        var dataSource = new DriverManagerDataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
        jdbc = new JdbcTemplate(dataSource);
        Flyway.configure().dataSource(dataSource).target("48").load().migrate();
        for (String role : new String[] { "SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR" }) {
            jdbc.update("INSERT INTO identity.users (email, password_hash, first_name, last_name, role) VALUES (?, 'x', 'A', 'B', ?)",
                    role.toLowerCase() + "@legacy.test", role);
        }
        flyway = Flyway.configure().dataSource(dataSource).load();
        flyway.migrate();
    }

    @AfterAll
    static void stop() {
        POSTGRES.stop();
    }

    private static String roleOf(String email) {
        return jdbc.queryForObject("SELECT role FROM identity.users WHERE email = ?", String.class, email);
    }

    private static Map<String, String> permissionsOf(String email) {
        return jdbc.queryForList("""
                SELECT p.module, p.level FROM identity.worker_permissions p
                JOIN identity.users u ON u.id = p.user_id WHERE u.email = ?""", email).stream()
                .collect(Collectors.toMap(r -> (String) r.get("module"), r -> (String) r.get("level")));
    }

    @Test
    void superAdminBecomesTheOwnerWithoutRows() {
        assertThat(roleOf("super_admin@legacy.test")).isEqualTo("OWNER");
        assertThat(permissionsOf("super_admin@legacy.test")).isEmpty();
    }

    @Test
    void adminBecomesAWorkerWithPublisherAndAdvertising() {
        assertThat(roleOf("admin@legacy.test")).isEqualTo("WORKER");
        assertThat(permissionsOf("admin@legacy.test")).isEqualTo(Map.of(
                "ARTICLES", "PUBLISH", "PLACES", "PUBLISH", "EVENTS", "PUBLISH", "GALLERIES", "PUBLISH", "DIRECTORY", "PUBLISH",
                "CATEGORIES", "ACCESS", "STATS", "ACCESS", "ADVERTISING", "ACCESS"));
    }

    @Test
    void editorAndAuthorKeepTheirReach() {
        assertThat(roleOf("editor@legacy.test")).isEqualTo("WORKER");
        assertThat(permissionsOf("editor@legacy.test")).containsEntry("EVENTS", "PUBLISH").doesNotContainKey("ADVERTISING");
        assertThat(roleOf("author@legacy.test")).isEqualTo("WORKER");
        assertThat(permissionsOf("author@legacy.test")).containsEntry("ARTICLES", "CREATE").hasSize(5);
    }

    @Test
    void oldRolesAreRejectedFromNowOn() {
        assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO identity.users (email, password_hash, first_name, last_name, role) VALUES (?, 'x', 'A', 'B', 'ADMIN')",
                UUID.randomUUID() + "@legacy.test"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
