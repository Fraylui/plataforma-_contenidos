package pe.plataformacontenidos.identity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;

/**
 * Lo único que otros módulos necesitan saber de una cuenta: su correo, para
 * dejarlo en la auditoría. Las cuentas (User, UserRepository) son internas de
 * identity; nadie fuera puede leerlas ni modificarlas directamente.
 */
@Service
@Transactional(readOnly = true)
public class UserDirectory {

    private final UserRepository users;

    public UserDirectory(UserRepository users) {
        this.users = users;
    }

    public Optional<String> emailOf(UUID userId) {
        if (userId == null) {
            return Optional.empty();
        }
        return users.findById(userId).map(User::getEmail);
    }
}
