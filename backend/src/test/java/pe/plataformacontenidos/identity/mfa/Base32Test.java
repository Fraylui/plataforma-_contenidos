package pe.plataformacontenidos.identity.mfa;

import static org.assertj.core.api.Assertions.assertThat;

import java.security.SecureRandom;
import org.junit.jupiter.api.Test;

class Base32Test {

    @Test
    void encodeDecodeRoundTrips() {
        byte[] original = new byte[20];
        new SecureRandom().nextBytes(original);

        String encoded = Base32.encode(original);
        byte[] decoded = Base32.decode(encoded);

        assertThat(decoded).isEqualTo(original);
    }

    @Test
    void encodedValueUsesOnlyRfc4648Alphabet() {
        byte[] original = "plataforma-contenidos".getBytes();
        String encoded = Base32.encode(original);

        assertThat(encoded).matches("[A-Z2-7]+");
    }
}
