package pe.plataformacontenidos.taxonomy;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.shared.Slugify;

@Service
public class TagService {

    private final TagRepository tagRepository;

    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    /** Autores etiquetan libremente al escribir: si el tag no existe, se crea. */
    public Tag getOrCreate(String name) {
        String slug = Slugify.slugify(name);
        return tagRepository.findBySlug(slug).orElseGet(() -> tagRepository.save(new Tag(name, slug)));
    }

    public List<Tag> resolveAll(Set<UUID> tagIds) {
        return tagRepository.findByIdIn(tagIds);
    }

    public List<Tag> listAll() {
        return tagRepository.findAll();
    }

    public void delete(UUID id) {
        tagRepository.deleteById(id);
    }
}
