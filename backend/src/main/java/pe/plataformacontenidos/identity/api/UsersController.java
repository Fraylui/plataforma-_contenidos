package pe.plataformacontenidos.identity.api;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.AccountService;
import pe.plataformacontenidos.identity.api.dto.ChangePasswordRequest;
import pe.plataformacontenidos.identity.api.dto.MeResponse;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/** La cuenta propia ("Mi cuenta" en el panel): datos, permisos y cambio de contraseña. */
@RestController
@RequestMapping("/api/v1/users")
public class UsersController {

    private final AccountService accountService;

    public UsersController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return accountService.me(principal.userId());
    }

    @PostMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        accountService.changePassword(principal.userId(), request.currentPassword(), request.newPassword());
    }
}
