package pe.plataformacontenidos.identity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByRole(Role role);

    boolean existsByEmailIgnoreCase(String email);
}
