package pe.plataformacontenidos.taxonomy;

import java.util.List;
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
        String slug = uniqueSlugFrom(name);
        return categoryRepository.save(new Category(name, slug, description, parentId));
    }

    public Category update(UUID id, String name, String description, UUID parentId, int sortOrder) {
        Category category = getOrThrow(id);
        validateParent(parentId, id);
        category.update(name, description, parentId, sortOrder);
        return categoryRepository.save(category);
    }

    public void setActive(UUID id, boolean active) {
        Category category = getOrThrow(id);
        category.setActive(active);
        categoryRepository.save(category);
    }

    public List<Category> listActive() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    public List<Category> listAll() {
        return categoryRepository.findAll();
    }

    public Category getOrThrow(UUID id) {
        return categoryRepository.findById(id).orElseThrow(() -> new CategoryNotFoundException(id));
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
