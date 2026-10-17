package pe.plataformacontenidos.identity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class TemporaryPasswordGeneratorTest {

    @Test
    void twentyCharactersFromAnUnambiguousAlphabetAndNoRepeats() {
        TemporaryPasswordGenerator generator = new TemporaryPasswordGenerator();
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 1_000; i++) {
            String password = generator.next();
            assertThat(password).matches("[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789]{20}");
            seen.add(password);
        }
        assertThat(seen).hasSize(1_000);
    }
}
