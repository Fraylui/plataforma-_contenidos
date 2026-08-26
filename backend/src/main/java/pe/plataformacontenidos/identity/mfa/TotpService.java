package pe.plataformacontenidos.identity.mfa;

import java.nio.ByteBuffer;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/**
 * TOTP (RFC 6238) sobre HMAC-SHA1, 6 dígitos, paso de 30s — implementación
 * propia en vez de una librería externa: el algoritmo es pequeño, estable y
 * está fijado por RFC, así que una dependencia extra no aportaba nada salvo
 * riesgo de mantenimiento (CONTEXTO.md 37: evaluar dependencias antes de
 * sumarlas).
 */
@Service
public class TotpService {

    private static final int TIME_STEP_SECONDS = 30;
    private static final int DIGITS = 6;
    private static final int ALLOWED_DRIFT_STEPS = 1; // ventana ±30s para tolerar desfase de reloj del cliente
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Secreto crudo de 20 bytes (160 bits), como recomienda RFC 4226. */
    public byte[] generateSecret() {
        byte[] secret = new byte[20];
        RANDOM.nextBytes(secret);
        return secret;
    }

    public String toBase32(byte[] secret) {
        return Base32.encode(secret);
    }

    public String provisioningUri(byte[] secret, String accountLabel, String issuer) {
        return "otpauth://totp/" + urlEncode(issuer) + ":" + urlEncode(accountLabel)
                + "?secret=" + Base32.encode(secret)
                + "&issuer=" + urlEncode(issuer)
                + "&digits=" + DIGITS
                + "&period=" + TIME_STEP_SECONDS
                + "&algorithm=SHA1";
    }

    public boolean verify(byte[] secret, String code) {
        if (code == null || !code.matches("\\d{" + DIGITS + "}")) {
            return false;
        }
        long currentStep = System.currentTimeMillis() / 1000 / TIME_STEP_SECONDS;
        for (int drift = -ALLOWED_DRIFT_STEPS; drift <= ALLOWED_DRIFT_STEPS; drift++) {
            if (code.equals(generateCode(secret, currentStep + drift))) {
                return true;
            }
        }
        return false;
    }

    // Visibilidad de paquete a propósito: permite a TotpServiceTest verificar
    // el algoritmo RFC 6238 de punta a punta sin exponerlo como API pública.
    String generateCode(byte[] secret, long timeStep) {
        try {
            byte[] data = ByteBuffer.allocate(8).putLong(timeStep).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secret, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format("%0" + DIGITS + "d", otp);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HmacSHA1 no disponible", e);
        }
    }

    private String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}
