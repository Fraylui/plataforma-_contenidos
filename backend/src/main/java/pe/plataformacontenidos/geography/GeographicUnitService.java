package pe.plataformacontenidos.geography;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.shared.Slugify;

@Service
@Transactional
public class GeographicUnitService {

    private final GeographicUnitRepository repository;

    public GeographicUnitService(GeographicUnitRepository repository) {
        this.repository = repository;
    }

    public GeographicUnit create(String name, GeographyLevel level, UUID parentId) {
        validateParent(level, parentId);
        String slug = uniqueSlugFrom(name);
        return repository.save(new GeographicUnit(name, slug, level, parentId));
    }

    public GeographicUnit rename(UUID id, String name) {
        GeographicUnit unit = getOrThrow(id);
        unit.rename(name);
        return repository.save(unit);
    }

    public void setActive(UUID id, boolean active) {
        GeographicUnit unit = getOrThrow(id);
        unit.setActive(active);
        repository.save(unit);
    }

    public List<GeographicUnit> listChildren(GeographyLevel level, UUID parentId) {
        if (parentId == null) {
            return repository.findByActiveTrueAndLevelAndParentIdIsNull(level);
        }
        return repository.findByActiveTrueAndParentId(parentId);
    }

    public List<GeographicUnit> listAll() {
        return repository.findAll();
    }

    public GeographicUnit getOrThrow(UUID id) {
        return repository.findById(id).orElseThrow(() -> new GeographicUnitNotFoundException(id));
    }

    private void validateParent(GeographyLevel level, UUID parentId) {
        GeographyLevel requiredParentLevel = level.requiredParentLevel();

        if (requiredParentLevel == null) {
            if (parentId != null) {
                throw new InvalidGeographyHierarchyException("PAIS no puede tener padre");
            }
            return;
        }

        if (parentId == null) {
            throw new InvalidGeographyHierarchyException(
                    level + " requiere un padre de nivel " + requiredParentLevel);
        }

        GeographicUnit parent = repository.findById(parentId)
                .orElseThrow(() -> new GeographicUnitNotFoundException(parentId));

        if (parent.getLevel() != requiredParentLevel) {
            throw new InvalidGeographyHierarchyException(
                    level + " requiere un padre de nivel " + requiredParentLevel
                            + ", pero " + parent.getName() + " es de nivel " + parent.getLevel());
        }
    }

    private String uniqueSlugFrom(String name) {
        String base = Slugify.slugify(name);
        String candidate = base;
        int suffix = 2;
        while (repository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }
}
