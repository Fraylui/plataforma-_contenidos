package pe.plataformacontenidos.places.api;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.RequiresAnyModule;
import pe.plataformacontenidos.places.PlaceRepository;
import pe.plataformacontenidos.places.PlaceStatus;

/**
 * Lugares para elegir en los formularios de Eventos y Directorio (spec 2a,
 * hallazgo de la revisión final): solo id y nombre de los lugares no
 * archivados, para cualquiera con acceso a Lugares, Eventos o Directorio.
 * Antes esos formularios pedían el listado de Lugares, que exige ese
 * módulo, y fallaban para un trabajador sin él.
 */
@RestController
public class PlaceOptionsController {

    public static final String PATH = "/api/v1/admin/place-options";

    public record PlaceOption(UUID id, String name) {
    }

    private final PlaceRepository placeRepository;

    public PlaceOptionsController(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    @GetMapping(PATH)
    @RequiresAnyModule({ Module.PLACES, Module.EVENTS, Module.DIRECTORY })
    public List<PlaceOption> options() {
        return placeRepository.findAll().stream()
                .filter(place -> place.getStatus() != PlaceStatus.ARCHIVED)
                .map(place -> new PlaceOption(place.getId(), place.getName()))
                .sorted(Comparator.comparing(PlaceOption::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }
}
