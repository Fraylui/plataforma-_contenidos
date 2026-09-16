package pe.plataformacontenidos.advertising.api;

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
import pe.plataformacontenidos.advertising.AdvertiserService;
import pe.plataformacontenidos.advertising.api.dto.AdvertiserRequest;
import pe.plataformacontenidos.advertising.api.dto.AdvertiserResponse;

/** Solo admin (SecurityConfig): datos de contacto de negocios que compran publicidad directa. */
@RestController
@RequestMapping("/api/v1/admin/advertisers")
public class AdvertiserAdminController {

    private final AdvertiserService advertiserService;

    public AdvertiserAdminController(AdvertiserService advertiserService) {
        this.advertiserService = advertiserService;
    }

    @GetMapping
    public List<AdvertiserResponse> listAll() {
        return advertiserService.listAll().stream().map(AdvertiserResponse::from).toList();
    }

    @GetMapping("/{id}")
    public AdvertiserResponse getById(@PathVariable UUID id) {
        return AdvertiserResponse.from(advertiserService.getOrThrow(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdvertiserResponse create(@Valid @RequestBody AdvertiserRequest request) {
        var advertiser = advertiserService.create(request.name(), request.contactEmail(), request.contactPhone());
        return AdvertiserResponse.from(advertiser);
    }

    @PutMapping("/{id}")
    public AdvertiserResponse update(@PathVariable UUID id, @Valid @RequestBody AdvertiserRequest request) {
        var advertiser = advertiserService.update(id, request.name(), request.contactEmail(), request.contactPhone());
        return AdvertiserResponse.from(advertiser);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        advertiserService.delete(id);
    }
}
