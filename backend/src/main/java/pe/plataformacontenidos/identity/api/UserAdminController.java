package pe.plataformacontenidos.identity.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.UserAdminService;
import pe.plataformacontenidos.identity.api.dto.CreateUserRequest;
import pe.plataformacontenidos.identity.api.dto.UserResponse;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * Gestión de usuarios por administradores. No hay auto-registro público
 * todavía (CONTEXTO.md sección 34: ninguna feature de audiencia lo
 * requiere aún) — las cuentas editoriales y de otros admins las crea un
 * SUPER_ADMIN/ADMIN. La autorización por rol se aplica en SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class UserAdminController {

    private final UserAdminService userAdminService;

    public UserAdminController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @GetMapping
    public List<UserResponse> list() {
        return userAdminService.listUsers().stream().map(UserResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal UserPrincipal actingAdmin, HttpServletRequest httpRequest) {
        var created = userAdminService.createUser(request.email(), request.password(), request.displayName(),
                request.role(), actingAdmin.userId(), httpRequest.getRemoteAddr());
        return UserResponse.from(created);
    }
}
