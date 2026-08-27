package pe.plataformacontenidos.configuration;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingsRepository extends JpaRepository<PlatformSettings, UUID> {

    /** Solo existe una fila (constraint UNIQUE en singleton_guard) — cualquiera de las dos sirve. */
    Optional<PlatformSettings> findFirstByOrderByIdAsc();
}
