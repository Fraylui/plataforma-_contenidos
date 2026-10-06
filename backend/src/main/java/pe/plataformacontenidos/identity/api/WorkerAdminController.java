package pe.plataformacontenidos.identity.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserStatus;
import pe.plataformacontenidos.identity.WorkerService;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * Trabajadores del panel (spec 2a §5). Solo el dueño (OwnerOnlyPaths en
 * SecurityConfig). La contraseña temporal viaja una sola vez, en la
 * respuesta del alta o del restablecimiento; nunca en el listado.
 */
@RestController
@RequestMapping("/api/v1/admin/workers")
public class WorkerAdminController {

    public record WorkerResponse(UUID id, String email, String firstName, String lastName, UserStatus status,
            boolean mustChangePassword, Instant lastLoginAt, Map<Module, AccessLevel> permissions) {
    }

    public record CreateWorkerRequest(@NotBlank @Email String email, @NotBlank String firstName, @NotBlank String lastName,
            @NotNull Map<Module, AccessLevel> permissions) {
    }

    public record UpdatePermissionsRequest(@NotNull Map<Module, AccessLevel> permissions) {
    }

    public record CreatedWorkerResponse(WorkerResponse worker, String temporaryPassword) {
    }

    public record TemporaryPasswordResponse(String temporaryPassword) {
    }

    private final WorkerService workerService;

    public WorkerAdminController(WorkerService workerService) {
        this.workerService = workerService;
    }

    @GetMapping
    public List<WorkerResponse> list() {
        return workerService.list().stream().map(this::toResponse).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreatedWorkerResponse create(@Valid @RequestBody CreateWorkerRequest request,
            @AuthenticationPrincipal UserPrincipal owner, HttpServletRequest http) {
        var created = workerService.create(request.email(), request.firstName(), request.lastName(), request.permissions(),
                actor(owner, http));
        return new CreatedWorkerResponse(toResponse(created.worker()), created.temporaryPassword());
    }

    @PutMapping("/{id}/permissions")
    public WorkerResponse updatePermissions(@PathVariable UUID id, @Valid @RequestBody UpdatePermissionsRequest request,
            @AuthenticationPrincipal UserPrincipal owner, HttpServletRequest http) {
        return toResponse(workerService.updatePermissions(id, request.permissions(), actor(owner, http)));
    }

    @PostMapping("/{id}/reset-password")
    public TemporaryPasswordResponse resetPassword(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal owner,
            HttpServletRequest http) {
        return new TemporaryPasswordResponse(workerService.resetPassword(id, actor(owner, http)));
    }

    @PostMapping("/{id}/activate")
    public WorkerResponse activate(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal owner, HttpServletRequest http) {
        return toResponse(workerService.setActive(id, true, actor(owner, http)));
    }

    @PostMapping("/{id}/deactivate")
    public WorkerResponse deactivate(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal owner, HttpServletRequest http) {
        return toResponse(workerService.setActive(id, false, actor(owner, http)));
    }

    private WorkerResponse toResponse(User worker) {
        return new WorkerResponse(worker.getId(), worker.getEmail(), worker.getFirstName(), worker.getLastName(),
                worker.getStatus(), worker.isMustChangePassword(), worker.getLastLoginAt(),
                workerService.permissionsOf(worker.getId()));
    }

    private static WorkerService.Actor actor(UserPrincipal owner, HttpServletRequest http) {
        return new WorkerService.Actor(owner.userId(), http.getRemoteAddr());
    }
}
