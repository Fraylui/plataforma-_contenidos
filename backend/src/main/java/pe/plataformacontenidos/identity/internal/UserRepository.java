package pe.plataformacontenidos.identity.internal;

import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.UserStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByRole(Role role);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(Role role);

    long countByStatus(UserStatus status);
}
