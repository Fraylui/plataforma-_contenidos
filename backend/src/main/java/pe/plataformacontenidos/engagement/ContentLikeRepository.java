package pe.plataformacontenidos.engagement;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentLikeRepository extends JpaRepository<ContentLike, UUID> {

    long countByContentTypeAndContentId(ContentType contentType, UUID contentId);

    /** Conteo en bloque para listados: una sola consulta por página en vez de una por tarjeta. */
    @Query("select l.contentId, count(l) from ContentLike l where l.contentType = :type and l.contentId in :ids group by l.contentId")
    List<Object[]> countGroupedByContentId(@Param("type") ContentType type, @Param("ids") Collection<UUID> ids);

    Optional<ContentLike> findByContentTypeAndContentIdAndVisitorId(ContentType contentType, UUID contentId, UUID visitorId);
}
