package pe.plataformacontenidos.taxonomy;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.shared.Slugify;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Category create(String name, String description, UUID parentId) {
        validateParent(parentId, null);
        validateUniqueName(name, null);
        String slug = uniqueSlugFrom(name);
        return categoryRepository.save(new Category(name, slug, description, parentId));
    }

    public Category update(UUID id, String name, String description, UUID parentId, int sortOrder) {
        Category category = getOrThrow(id);
        validateParent(parentId, id);
        validateUniqueName(name, id);
        category.update(name, description, parentId, sortOrder);
        return categoryRepository.save(category);
    }

    public void setActive(UUID id, boolean active) {
        Category category = getOrThrow(id);
        category.setActive(active);
        categoryRepository.save(category);
    }

    /** Ver CategoryRepository.findActiveIdsMatchingName — lo usa la búsqueda unificada. */
    public List<UUID> findActiveIdsMatchingName(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return categoryRepository.findActiveIdsMatchingName(query.trim());
    }

    public List<Category> listActive() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    public List<Category> listAll() {
        return categoryRepository.findAll();
    }

    public long countAll() {
        return categoryRepository.count();
    }

    public long countActive() {
        return categoryRepository.countByActiveTrue();
    }

    public Category getOrThrow(UUID id) {
        return categoryRepository.findById(id).orElseThrow(() -> new CategoryNotFoundException(id));
    }

    /**
     * La categoría y todos sus ancestros (hasta la raíz). Lo usa la
     * segmentación de publicidad: una campaña que eligió "Turismo" también
     * corresponde a contenido de una subcategoría de Turismo.
     */
    public Set<UUID> lineage(UUID id) {
        Map<UUID, UUID> parentOf = new HashMap<>();
        for (Category category : categoryRepository.findAll()) {
            parentOf.put(category.getId(), category.getParentId());
        }
        Set<UUID> lineage = new LinkedHashSet<>();
        for (UUID current = id; current != null && lineage.add(current); current = parentOf.get(current)) {
            // sube hasta la raíz; `add` falso corta un ciclo (no debería existir, ver validateParent)
        }
        return lineage;
    }

    /** La categoría y todas sus subcategorías (a cualquier profundidad): filtrar por un tema incluye sus subtemas. */
    public Set<UUID> descendants(UUID id) {
        Map<UUID, UUID> parentOf = new HashMap<>();
        for (Category category : categoryRepository.findAll()) {
            parentOf.put(category.getId(), category.getParentId());
        }
        Set<UUID> result = new LinkedHashSet<>();
        for (UUID candidate : parentOf.keySet()) {
            Set<UUID> seen = new HashSet<>();
            for (UUID current = candidate; current != null && seen.add(current); current = parentOf.get(current)) {
                if (current.equals(id)) {
                    result.add(candidate);
                    break;
                }
            }
        }
        return result;
    }

    public boolean existsActive(UUID id) {
        return categoryRepository.findById(id).map(Category::isActive).orElse(false);
    }

    private void validateParent(UUID parentId, UUID selfId) {
        if (parentId == null) {
            return;
        }
        if (parentId.equals(selfId)) {
            throw new InvalidCategoryHierarchyException("Una categoría no puede ser su propio padre");
        }
        if (!categoryRepository.existsById(parentId)) {
            throw new CategoryNotFoundException(parentId);
        }
        if (selfId != null && createsCycle(parentId, selfId)) {
            throw new InvalidCategoryHierarchyException("La jerarquía de categorías no puede formar un ciclo");
        }
    }

    private boolean createsCycle(UUID candidateParentId, UUID selfId) {
        UUID current = candidateParentId;
        while (current != null) {
            if (current.equals(selfId)) {
                return true;
            }
            current = categoryRepository.findById(current).map(Category::getParentId).orElse(null);
        }
        return false;
    }

    private void validateUniqueName(String name, UUID selfId) {
        boolean duplicate = selfId == null
                ? categoryRepository.existsByNameIgnoreCase(name)
                : categoryRepository.existsByNameIgnoreCaseAndIdNot(name, selfId);
        if (duplicate) {
            throw new DuplicateCategoryNameException(name);
        }
    }

    private String uniqueSlugFrom(String name) {
        String base = Slugify.slugify(name);
        String candidate = base;
        int suffix = 2;
        while (categoryRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }
}
