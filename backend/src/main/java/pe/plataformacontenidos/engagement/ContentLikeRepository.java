package pe.plataformacontenidos.engagement;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentLikeRepository extends JpaRepository<ContentLike, UUID> {

    long countByContentTypeAndContentId(ContentType contentType, UUID contentId);

    /** Conteo en bloque para listados: una sola consulta por página en vez de una por tarjeta. */
    @Query("select l.contentId, count(l) from ContentLike l where l.contentType = :type and l.contentId in :ids group by l.contentId")
    List<Object[]> countGroupedByContentId(@Param("type") ContentType type, @Param("ids") Collection<UUID> ids);

    /** Como countGroupedByContentId, pero solo los "me gusta" dados desde `since` (actividad reciente). */
    @Query("select l.contentId, count(l) from ContentLike l where l.contentType = :type and l.contentId in :ids"
            + " and l.createdAt >= :since group by l.contentId")
    List<Object[]> countGroupedByContentIdSince(@Param("type") ContentType type, @Param("ids") Collection<UUID> ids,
            @Param("since") java.time.Instant since);

    /** Quita el "me gusta" si existe; devuelve cuántas filas borró (0 o 1). Atómico, sin leer antes. */
    @Modifying
    @Query("delete from ContentLike l where l.contentType = :type and l.contentId = :contentId and l.visitorId = :visitorId")
    int deleteLike(@Param("type") ContentType type, @Param("contentId") UUID contentId, @Param("visitorId") UUID visitorId);

    /**
     * Da el "me gusta" sin chocar si otra petición simultánea del mismo lector
     * ya lo dio (doble toque): ON CONFLICT DO NOTHING sobre la restricción única.
     */
    @Modifying
    @Query(value = "insert into engagement.content_likes (id, content_type, content_id, visitor_id, created_at)"
            + " values (gen_random_uuid(), :type, :contentId, :visitorId, now())"
            + " on conflict (content_type, content_id, visitor_id) do nothing", nativeQuery = true)
    int insertLikeIfAbsent(@Param("type") String type, @Param("contentId") UUID contentId, @Param("visitorId") UUID visitorId);
}
