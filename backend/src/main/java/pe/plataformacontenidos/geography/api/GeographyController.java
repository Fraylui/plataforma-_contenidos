package pe.plataformacontenidos.geography.api;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.geography.GeographicUnitService;
import pe.plataformacontenidos.geography.GeographyLevel;
import pe.plataformacontenidos.geography.api.dto.CreateGeographicUnitRequest;
import pe.plataformacontenidos.geography.api.dto.GeographicUnitResponse;
import pe.plataformacontenidos.geography.api.dto.RenameGeographicUnitRequest;

/**
 * Lectura pública (necesaria para navegación/filtrado por ubicación),
 * escritura EDITOR+ — mismo patrón que Taxonomy (CategoryController).
 */
@RestController
@RequestMapping("/api/v1")
public class GeographyController {

    private final GeographicUnitService geographyService;

    public GeographyController(GeographicUnitService geographyService) {
        this.geographyService = geographyService;
    }

    /** Sin parentId: lista raíces de ese nivel (normalmente PAIS). Con parentId: hijos directos, cualquier nivel. */
    @GetMapping("/geography")
    public List<GeographicUnitResponse> listChildren(
            @RequestParam(defaultValue = "PAIS") GeographyLevel level,
            @RequestParam(required = false) UUID parentId) {
        return geographyService.listChildren(level, parentId).stream().map(GeographicUnitResponse::from).toList();
    }

    @GetMapping("/admin/geography")
    public List<GeographicUnitResponse> listAll() {
        return geographyService.listAll().stream().map(GeographicUnitResponse::from).toList();
    }

    @PostMapping("/admin/geography")
    @ResponseStatus(HttpStatus.CREATED)
    public GeographicUnitResponse create(@Valid @RequestBody CreateGeographicUnitRequest request) {
        var unit = geographyService.create(request.name(), request.level(), request.parentId());
        return GeographicUnitResponse.from(unit);
    }

    @PutMapping("/admin/geography/{id}")
    public GeographicUnitResponse rename(@PathVariable UUID id, @Valid @RequestBody RenameGeographicUnitRequest request) {
        return GeographicUnitResponse.from(geographyService.rename(id, request.name()));
    }

    @PostMapping("/admin/geography/{id}/activate")
    public void activate(@PathVariable UUID id) {
        geographyService.setActive(id, true);
    }

    @DeleteMapping("/admin/geography/{id}")
    public void deactivate(@PathVariable UUID id) {
        geographyService.setActive(id, false);
    }
}
