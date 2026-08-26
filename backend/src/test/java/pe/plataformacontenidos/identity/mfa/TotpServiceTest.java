package pe.plataformacontenidos.identity.mfa;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TotpServiceTest {

    private final TotpService totpService = new TotpService();

    @Test
    void correctlyGeneratedCodeForCurrentWindowVerifiesSuccessfully() {
        byte[] secret = totpService.generateSecret();
        long currentStep = System.currentTimeMillis() / 1000 / 30;

        String code = totpService.generateCode(secret, currentStep);

        assertThat(code).matches("\\d{6}");
        assertThat(totpService.verify(secret, code)).isTrue();
    }

    @Test
    void codeFromDifferentSecretIsRejected() {
        byte[] secretA = totpService.generateSecret();
        byte[] secretB = totpService.generateSecret();
        long currentStep = System.currentTimeMillis() / 1000 / 30;

        String codeForB = totpService.generateCode(secretB, currentStep);

        assertThat(totpService.verify(secretA, codeForB)).isFalse();
    }

    @Test
    void codeOutsideDriftWindowIsRejected() {
        byte[] secret = totpService.generateSecret();
        long currentStep = System.currentTimeMillis() / 1000 / 30;

        String farFutureCode = totpService.generateCode(secret, currentStep + 5);

        assertThat(totpService.verify(secret, farFutureCode)).isFalse();
    }

    @Test
    void malformedCodeIsRejected() {
        byte[] secret = totpService.generateSecret();
        assertThat(totpService.verify(secret, "abc")).isFalse();
        assertThat(totpService.verify(secret, null)).isFalse();
    }

    @Test
    void provisioningUriContainsExpectedFields() {
        byte[] secret = totpService.generateSecret();
        String uri = totpService.provisioningUri(secret, "user@example.com", "Plataforma de Contenidos");

        assertThat(uri).startsWith("otpauth://totp/");
        assertThat(uri).contains("secret=" + totpService.toBase32(secret));
        assertThat(uri).contains("digits=6");
        assertThat(uri).contains("period=30");
    }
}
