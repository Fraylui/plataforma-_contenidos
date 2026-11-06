package pe.plataformacontenidos.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;

class UserDirectoryTest {

    private final UserRepository users = mock(UserRepository.class);
    private final UserDirectory directory = new UserDirectory(users);

    @Test
    void givesOnlyTheEmailOfAKnownUser() {
        UUID id = UUID.randomUUID();
        when(users.findById(id)).thenReturn(Optional.of(new User("ana@ejemplo.pe", "hash", "Ana", "Ríos", Role.WORKER)));

        assertThat(directory.emailOf(id)).contains("ana@ejemplo.pe");
    }

    @Test
    void anUnknownOrMissingUserHasNoEmail() {
        assertThat(directory.emailOf(UUID.randomUUID())).isEmpty();
        assertThat(directory.emailOf(null)).isEmpty();
    }
}
