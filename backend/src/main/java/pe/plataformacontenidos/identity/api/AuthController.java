package pe.plataformacontenidos.identity.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.AuthService;
import pe.plataformacontenidos.identity.api.dto.LoginRequest;
import pe.plataformacontenidos.identity.api.dto.RefreshRequest;
import pe.plataformacontenidos.identity.api.dto.TokenResponse;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        var tokens = authService.login(request.email(), request.password(), clientIp(httpRequest));
        return TokenResponse.of(tokens.accessToken(), tokens.refreshToken());
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest request, HttpServletRequest httpRequest) {
        var tokens = authService.refresh(request.refreshToken(), clientIp(httpRequest));
        return TokenResponse.of(tokens.accessToken(), tokens.refreshToken());
    }

    @PostMapping("/logout")
    public void logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
