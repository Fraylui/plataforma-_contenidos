package pe.plataformacontenidos.media;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImageRepository extends JpaRepository<Image, UUID> {
    List<Image> findAllByOrderByCreatedAtDesc();

    List<Image> findByPurposeOrderByCreatedAtDesc(ImagePurpose purpose);

    List<Image> findByUploadedByOrderByCreatedAtDesc(UUID uploadedBy);

    List<Image> findByUploadedByAndPurposeOrderByCreatedAtDesc(UUID uploadedBy, ImagePurpose purpose);
}
