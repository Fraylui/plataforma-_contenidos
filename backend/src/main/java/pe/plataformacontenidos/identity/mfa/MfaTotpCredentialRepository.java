package pe.plataformacontenidos.identity.mfa;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MfaTotpCredentialRepository extends JpaRepository<MfaTotpCredential, UUID> {
}
