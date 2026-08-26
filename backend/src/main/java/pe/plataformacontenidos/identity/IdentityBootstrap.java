package pe.plataformacontenidos.identity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea el primer SUPER_ADMIN al arrancar, solo si todavía no existe ninguno.
 * Las credenciales nunca están en el código: vienen de variables de entorno
 * (BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD). Si no están definidas,
 * simplemente no hace nada (no rompe arranques normales una vez bootstrapeado).
 */
@Component
public class IdentityBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(IdentityBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String bootstrapEmail;
    private final String bootstrapPassword;

    public IdentityBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder,
            @Value("${app.security.bootstrap-admin-email:}") String bootstrapEmail,
            @Value("${app.security.bootstrap-admin-password:}") String bootstrapPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapEmail = bootstrapEmail;
        this.bootstrapPassword = bootstrapPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByRole(Role.SUPER_ADMIN)) {
            return;
        }

        if (bootstrapEmail.isBlank() || bootstrapPassword.isBlank()) {
            log.warn("No existe SUPER_ADMIN y no se definieron BOOTSTRAP_ADMIN_EMAIL / "
                    + "BOOTSTRAP_ADMIN_PASSWORD: el sistema queda sin administrador hasta que se configuren.");
            return;
        }

        User admin = new User(bootstrapEmail, passwordEncoder.encode(bootstrapPassword),
                "Administrador inicial", Role.SUPER_ADMIN);
        userRepository.save(admin);
        log.info("SUPER_ADMIN inicial creado para {}", bootstrapEmail);
    }
}
