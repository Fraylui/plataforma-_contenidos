package pe.plataformacontenidos.advertising;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdvertiserRepository extends JpaRepository<Advertiser, UUID> {
}
