package pe.plataformacontenidos.identity.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.UserAdminService;
import pe.plataformacontenidos.identity.api.dto.CreateUserRequest;
import pe.plataformacontenidos.identity.api.dto.UserResponse;
import pe.plataformacontenidos.identity.mfa.MfaService;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * Gestión de usuarios por administradores. No hay auto-registro público
 * todavía (CONTEXTO.md sección 34: ninguna feature de audiencia lo
 * requiere aún) — las cuentas editoriales y de otros admins las crea un
 * SUPER_ADMIN/ADMIN. La autorización por rol se aplica en SecurityConfig;
 * la excepción de que un ADMIN no pueda tocar cuentas SUPER_ADMIN vive en
 * UserAdminService (autorización a nivel de objeto, mismo patrón que
 * ArticleService — ver esa clase).
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class UserAdminController {

    private final UserAdminService userAdminService;
    private final MfaService mfaService;

    public UserAdminController(UserAdminService userAdminService, MfaService mfaService) {
        this.userAdminService = userAdminService;
        this.mfaService = mfaService;
    }

    @GetMapping
    public List<UserResponse> list() {
        return userAdminService.listUsers().stream()
                .map(user -> UserResponse.from(user, mfaService.isEnabled(user.getId())))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal UserPrincipal actingAdmin, HttpServletRequest httpRequest) {
        var created = userAdminService.createUser(request.email(), request.password(), request.displayName(),
                request.role(), actingAdmin.userId(), actingAdmin.role(), httpRequest.getRemoteAddr());
        // Usuario recién creado: MFA nunca puede estar habilitado todavía.
        return UserResponse.from(created, false);
    }

    @PostMapping("/{id}/activate")
    public UserResponse activate(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal actingAdmin,
            HttpServletRequest httpRequest) {
        var user = userAdminService.setActive(id, true, actingAdmin.userId(), actingAdmin.role(),
                httpRequest.getRemoteAddr());
        return UserResponse.from(user, mfaService.isEnabled(user.getId()));
    }

    @DeleteMapping("/{id}")
    public UserResponse deactivate(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal actingAdmin,
            HttpServletRequest httpRequest) {
        var user = userAdminService.setActive(id, false, actingAdmin.userId(), actingAdmin.role(),
                httpRequest.getRemoteAddr());
        return UserResponse.from(user, mfaService.isEnabled(user.getId()));
    }
}
