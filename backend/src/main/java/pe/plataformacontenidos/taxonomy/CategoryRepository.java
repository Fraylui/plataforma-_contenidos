package pe.plataformacontenidos.taxonomy;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    List<Category> findByActiveTrueOrderBySortOrderAsc();

    long countByActiveTrue();

    /**
     * Categorías activas cuyo nombre coincide con una búsqueda, más sus
     * subcategorías directas (buscar "Turismo" también trae lo de
     * "Turismo rural"). Mismo análisis de texto que el resto de la búsqueda
     * (español + sin acentos, ver V36__search_unaccent.sql): "gastronomia"
     * encuentra "Gastronomía". websearch_to_tsquery exige todas las palabras,
     * así que "turismo lima" no arrastra la categoría Turismo entera.
     */
    @Query(value = """
            WITH matched AS (
                SELECT c.id FROM taxonomy.categories c
                WHERE c.active
                  AND to_tsvector('spanish', public.immutable_unaccent(c.name))
                      @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            )
            SELECT id FROM matched
            UNION
            SELECT c.id FROM taxonomy.categories c
            WHERE c.active AND c.parent_id IN (SELECT id FROM matched)
            """, nativeQuery = true)
    List<UUID> findActiveIdsMatchingName(@Param("query") String query);
}
