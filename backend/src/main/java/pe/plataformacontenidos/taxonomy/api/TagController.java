package pe.plataformacontenidos.taxonomy.api;

import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.taxonomy.TagService;
import pe.plataformacontenidos.taxonomy.api.dto.TagResponse;

@RestController
@RequestMapping("/api/v1")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping("/tags")
    public List<TagResponse> listAll() {
        return tagService.listAll().stream().map(TagResponse::from).toList();
    }

    @DeleteMapping("/admin/tags/{id}")
    public void delete(@PathVariable UUID id) {
        tagService.delete(id);
    }
}
