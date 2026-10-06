package pe.plataformacontenidos.identity.permission;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkerPermissionRepository extends JpaRepository<WorkerPermission, WorkerPermission.Key> {

    List<WorkerPermission> findByUserId(UUID userId);

    void deleteByUserId(UUID userId);
}
