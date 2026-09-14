package pe.plataformacontenidos.identity.api;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.plataformacontenidos.identity.InvalidCredentialsException;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import pe.plataformacontenidos.identity.api.dto.UserResponse;
import pe.plataformacontenidos.identity.security.UserPrincipal;

@RestController
@RequestMapping("/api/v1/users")
public class UsersController {

    private final UserRepository userRepository;

    public UsersController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(InvalidCredentialsException::new);
        return UserResponse.from(user);
    }
}
