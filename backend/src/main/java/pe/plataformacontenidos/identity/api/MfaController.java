package pe.plataformacontenidos.identity.api;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.InvalidCredentialsException;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import pe.plataformacontenidos.identity.api.dto.MfaBackupCodesResponse;
import pe.plataformacontenidos.identity.api.dto.MfaChallengeRequest;
import pe.plataformacontenidos.identity.api.dto.MfaEnrollRequest;
import pe.plataformacontenidos.identity.api.dto.MfaEnrollmentResponse;
import pe.plataformacontenidos.identity.mfa.MfaService;
import pe.plataformacontenidos.identity.security.UserPrincipal;

/**
 * Autogestión de MFA sobre la propia cuenta. Obligatorio en la práctica para
 * SUPER_ADMIN (CONTEXTO.md 36.5) — ver AuthService para cómo se hace cumplir
 * en el login. Disponible para cualquier usuario autenticado.
 */
@RestController
@RequestMapping("/api/v1/users/me/mfa")
public class MfaController {

    private final MfaService mfaService;
    private final UserRepository userRepository;

    public MfaController(MfaService mfaService, UserRepository userRepository) {
        this.mfaService = mfaService;
        this.userRepository = userRepository;
    }

    @PostMapping("/enroll")
    public MfaEnrollmentResponse enroll(@AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) MfaEnrollRequest request) {
        User user = userRepository.findById(principal.userId()).orElseThrow(InvalidCredentialsException::new);
        String currentCode = request != null ? request.currentCode() : null;
        var result = mfaService.startEnrollment(user.getId(), user.getEmail(), currentCode);
        return new MfaEnrollmentResponse(result.provisioningUri(), result.secretBase32());
    }

    @PostMapping("/confirm")
    public MfaBackupCodesResponse confirm(@AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MfaChallengeRequest request) {
        var backupCodes = mfaService.confirmEnrollment(principal.userId(), request.code());
        return new MfaBackupCodesResponse(backupCodes);
    }

    @PostMapping("/disable")
    public void disable(@AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MfaChallengeRequest request) {
        mfaService.disable(principal.userId(), request.code());
    }
}
