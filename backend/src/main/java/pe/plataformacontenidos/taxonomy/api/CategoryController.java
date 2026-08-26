package pe.plataformacontenidos.taxonomy.api;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.taxonomy.CategoryService;
import pe.plataformacontenidos.taxonomy.api.dto.CategoryResponse;
import pe.plataformacontenidos.taxonomy.api.dto.CreateCategoryRequest;
import pe.plataformacontenidos.taxonomy.api.dto.UpdateCategoryRequest;

/**
 * Lectura pública (necesaria para navegación del sitio), escritura
 * restringida a EDITOR+ (SecurityConfig). Las categorías son taxonomía
 * editorial, no algo que un AUTHOR deba poder reestructurar libremente.
 */
@RestController
@RequestMapping("/api/v1")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> listActive() {
        return categoryService.listActive().stream().map(CategoryResponse::from).toList();
    }

    @GetMapping("/admin/categories")
    public List<CategoryResponse> listAll() {
        return categoryService.listAll().stream().map(CategoryResponse::from).toList();
    }

    @PostMapping("/admin/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CreateCategoryRequest request) {
        var category = categoryService.create(request.name(), request.description(), request.parentId());
        return CategoryResponse.from(category);
    }

    @PutMapping("/admin/categories/{id}")
    public CategoryResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateCategoryRequest request) {
        var category = categoryService.update(id, request.name(), request.description(), request.parentId(),
                request.sortOrder());
        return CategoryResponse.from(category);
    }

    @PostMapping("/admin/categories/{id}/activate")
    public void activate(@PathVariable UUID id) {
        categoryService.setActive(id, true);
    }

    @DeleteMapping("/admin/categories/{id}")
    public void deactivate(@PathVariable UUID id) {
        // "Eliminar" una categoría con contenido asociado es destructivo; se
        // desactiva en vez de borrar (sigue existiendo para artículos ya
        // publicados con esa categoría, pero deja de ofrecerse para nuevos).
        categoryService.setActive(id, false);
    }
}
