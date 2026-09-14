package pe.plataformacontenidos.advertising;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.shared.Slugify;

@Service
@Transactional
public class AdPlacementService {

    private final AdPlacementRepository repository;

    public AdPlacementService(AdPlacementRepository repository) {
        this.repository = repository;
    }

    /** `key` es lo que un desarrollador pega en `<AdBlock position="..." />` — se normaliza igual que un slug. */
    public AdPlacement create(String key, String label, String adsenseSlotId) {
        String normalizedKey = Slugify.slugify(key);
        validateUniqueKey(normalizedKey, null);
        return repository.save(new AdPlacement(normalizedKey, label, adsenseSlotId));
    }

    public AdPlacement update(UUID id, String label, String adsenseSlotId) {
        AdPlacement placement = getOrThrow(id);
        placement.update(label, adsenseSlotId);
        return repository.save(placement);
    }

    public void setEnabled(UUID id, boolean enabled) {
        AdPlacement placement = getOrThrow(id);
        placement.setEnabled(enabled);
        repository.save(placement);
    }

    public void delete(UUID id) {
        repository.deleteById(id);
    }

    public List<AdPlacement> listAll() {
        return repository.findAll();
    }

    public List<AdPlacement> listEnabled() {
        return repository.findByEnabledTrue();
    }

    public AdPlacement getOrThrow(UUID id) {
        return repository.findById(id).orElseThrow(() -> new AdPlacementNotFoundException(id));
    }

    private void validateUniqueKey(String key, UUID selfId) {
        boolean duplicate = selfId == null ? repository.existsByKey(key) : repository.existsByKeyAndIdNot(key, selfId);
        if (duplicate) {
            throw new DuplicateAdPlacementKeyException(key);
        }
    }
}
