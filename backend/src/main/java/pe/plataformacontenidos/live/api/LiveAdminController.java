package pe.plataformacontenidos.live.api;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.RequiresModule;
import pe.plataformacontenidos.identity.UserPrincipal;
import pe.plataformacontenidos.live.LiveStreamService;
import pe.plataformacontenidos.live.api.LiveDtos.LiveRequest;
import pe.plataformacontenidos.live.api.LiveDtos.LiveResponse;
import pe.plataformacontenidos.shared.PageResponse;

/** En vivo en el panel: lo gestiona quien tiene el módulo Series (son programas, como las series). */
@RestController
@RequiresModule(value = Module.SERIES)
@RequestMapping("/api/v1/admin/live")
public class LiveAdminController {

    private final LiveStreamService liveStreamService;

    public LiveAdminController(LiveStreamService liveStreamService) {
        this.liveStreamService = liveStreamService;
    }

    @GetMapping
    public PageResponse<LiveResponse> list(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100));
        return PageResponse.from(liveStreamService.listForAdmin(pageable), LiveResponse::from);
    }

    @GetMapping("/{id}")
    public LiveResponse get(@PathVariable UUID id) {
        return LiveResponse.from(liveStreamService.getForAdmin(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LiveResponse create(@Valid @RequestBody LiveRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        return LiveResponse.from(liveStreamService.create(request.toInput(), principal.userId()));
    }

    @PutMapping("/{id}")
    public LiveResponse update(@PathVariable UUID id, @Valid @RequestBody LiveRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return LiveResponse.from(liveStreamService.update(id, request.toInput(), principal.userId()));
    }

    @PostMapping("/{id}/start")
    public LiveResponse start(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return LiveResponse.from(liveStreamService.goLive(id, principal.userId()));
    }

    @PostMapping("/{id}/end")
    public LiveResponse end(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return LiveResponse.from(liveStreamService.end(id, principal.userId()));
    }

    @PostMapping("/{id}/cancel")
    public LiveResponse cancel(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return LiveResponse.from(liveStreamService.cancel(id, principal.userId()));
    }
}
