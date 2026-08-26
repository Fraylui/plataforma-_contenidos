package pe.plataformacontenidos.identity.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import pe.plataformacontenidos.identity.Role;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            new JwtProperties("unit-test-secret-value-needs-32-bytes-minimum!!", 15, 30));

    @Test
    void issuedTokenParsesBackToSameClaims() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.issueAccessToken(userId, Role.EDITOR);
        var claims = jwtService.parse(token);

        assertThat(claims).isPresent();
        assertThat(claims.get().userId()).isEqualTo(userId);
        assertThat(claims.get().role()).isEqualTo(Role.EDITOR);
    }

    @Test
    void garbageTokenFailsToParse() {
        assertThat(jwtService.parse("not-a-real-jwt")).isEmpty();
    }

    @Test
    void tokenSignedWithDifferentSecretIsRejected() {
        JwtService other = new JwtService(
                new JwtProperties("a-completely-different-secret-also-32-bytes-plus", 15, 30));
        String token = other.issueAccessToken(UUID.randomUUID(), Role.USER);

        assertThat(jwtService.parse(token)).isEmpty();
    }
}
