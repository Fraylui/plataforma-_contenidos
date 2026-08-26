package pe.plataformacontenidos.identity.mfa;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MfaService {

    private static final int BACKUP_CODE_COUNT = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final MfaTotpCredentialRepository credentialRepository;
    private final MfaBackupCodeRepository backupCodeRepository;
    private final TotpService totpService;
    private final SecretEncryptor secretEncryptor;
    private final PasswordEncoder passwordEncoder;
    private final MfaProperties properties;

    public MfaService(MfaTotpCredentialRepository credentialRepository, MfaBackupCodeRepository backupCodeRepository,
            TotpService totpService, SecretEncryptor secretEncryptor, PasswordEncoder passwordEncoder,
            MfaProperties properties) {
        this.credentialRepository = credentialRepository;
        this.backupCodeRepository = backupCodeRepository;
        this.totpService = totpService;
        this.secretEncryptor = secretEncryptor;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    public boolean isEnabled(UUID userId) {
        return credentialRepository.findById(userId).map(MfaTotpCredential::isEnabled).orElse(false);
    }

    /**
     * Genera un secreto nuevo (deshabilitado hasta confirmar) y su URI de
     * aprovisionamiento para el QR. Si la cuenta YA tiene MFA habilitado,
     * exige currentCode válido antes de tocar el secreto activo: reemplazarlo
     * deshabilita el MFA de inmediato (MfaTotpCredential.replaceSecret), así
     * que sin esta verificación un access token robado (15 min de vida)
     * bastaría para desactivar el MFA "obligatorio" de un SUPER_ADMIN sin
     * conocer su código actual (CONTEXTO.md sección 36.5). Primer
     * enrolamiento o uno abandonado sin confirmar no requieren currentCode:
     * todavía no hay nada activo que proteger.
     */
    @Transactional
    public EnrollmentResult startEnrollment(UUID userId, String accountEmail, String currentCode) {
        Optional<MfaTotpCredential> existing = credentialRepository.findById(userId);
        boolean isRotation = existing.isPresent() && existing.get().isEnabled();
        if (isRotation && !verifyChallenge(userId, currentCode)) {
            throw new MfaChallengeException("Se requiere el código MFA actual para reemplazarlo");
        }

        byte[] secret = totpService.generateSecret();
        String encrypted = secretEncryptor.encrypt(secret);

        if (isRotation) {
            // No se toca el secreto activo hasta confirmar: si el usuario
            // abandona el flujo, la cuenta sigue protegida con el secreto
            // anterior (ver MfaTotpCredential.stageRotation).
            existing.get().stageRotation(encrypted);
            credentialRepository.save(existing.get());
        } else {
            MfaTotpCredential credential = existing.orElseGet(() -> new MfaTotpCredential(userId, encrypted));
            credential.replaceSecret(encrypted);
            credentialRepository.save(credential);
        }

        String uri = totpService.provisioningUri(secret, accountEmail, properties.issuer());
        return new EnrollmentResult(uri, totpService.toBase32(secret));
    }

    /** Confirma el enrolamiento (o una rotación) con un código válido y emite códigos de respaldo (se muestran una sola vez). */
    @Transactional
    public List<String> confirmEnrollment(UUID userId, String code) {
        MfaTotpCredential credential = credentialRepository.findById(userId)
                .orElseThrow(() -> new MfaChallengeException("No hay un enrolamiento MFA pendiente"));

        String pendingOrActiveSecret = credential.hasPendingSecret()
                ? credential.getPendingSecretEncrypted()
                : credential.getSecretEncrypted();
        byte[] secret = secretEncryptor.decrypt(pendingOrActiveSecret);
        if (!totpService.verify(secret, code)) {
            throw new MfaChallengeException("Código MFA inválido");
        }

        if (credential.hasPendingSecret()) {
            credential.promotePendingSecret();
        } else {
            credential.confirm();
        }
        credentialRepository.save(credential);

        return regenerateBackupCodes(userId);
    }

    @Transactional
    public void disable(UUID userId, String code) {
        if (!verifyChallenge(userId, code)) {
            throw new MfaChallengeException("Código MFA inválido");
        }
        credentialRepository.findById(userId).ifPresent(c -> {
            c.disable();
            credentialRepository.save(c);
        });
        backupCodeRepository.deleteByUserId(userId);
    }

    /** Usado en login: TOTP válido o un código de respaldo no usado. */
    @Transactional
    public boolean verifyChallenge(UUID userId, String code) {
        if (code == null || code.isBlank()) {
            return false;
        }

        Optional<MfaTotpCredential> credential = credentialRepository.findById(userId);
        if (credential.isPresent()) {
            byte[] secret = secretEncryptor.decrypt(credential.get().getSecretEncrypted());
            if (totpService.verify(secret, code)) {
                return true;
            }
        }

        for (MfaBackupCode backupCode : backupCodeRepository.findByUserIdAndUsedAtIsNull(userId)) {
            if (passwordEncoder.matches(code, backupCode.getCodeHash())) {
                backupCode.markUsed();
                backupCodeRepository.save(backupCode);
                return true;
            }
        }
        return false;
    }

    private List<String> regenerateBackupCodes(UUID userId) {
        backupCodeRepository.deleteByUserId(userId);
        List<String> rawCodes = new ArrayList<>(BACKUP_CODE_COUNT);
        for (int i = 0; i < BACKUP_CODE_COUNT; i++) {
            String raw = generateBackupCode();
            rawCodes.add(raw);
            backupCodeRepository.save(new MfaBackupCode(userId, passwordEncoder.encode(raw)));
        }
        return rawCodes;
    }

    private String generateBackupCode() {
        // 10 dígitos, formato "1234-5678-90" para legibilidad al transcribir
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }

    public record EnrollmentResult(String provisioningUri, String secretBase32) {
    }
}
