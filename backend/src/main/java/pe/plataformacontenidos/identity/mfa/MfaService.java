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

    /** Genera un secreto nuevo (deshabilitado hasta confirmar) y su URI de aprovisionamiento para el QR. */
    @Transactional
    public EnrollmentResult startEnrollment(UUID userId, String accountEmail) {
        byte[] secret = totpService.generateSecret();
        String encrypted = secretEncryptor.encrypt(secret);

        MfaTotpCredential credential = credentialRepository.findById(userId)
                .orElseGet(() -> new MfaTotpCredential(userId, encrypted));
        credential.replaceSecret(encrypted);
        credentialRepository.save(credential);

        String uri = totpService.provisioningUri(secret, accountEmail, properties.issuer());
        return new EnrollmentResult(uri, totpService.toBase32(secret));
    }

    /** Confirma el enrolamiento con un código válido, habilita MFA y emite códigos de respaldo (se muestran una sola vez). */
    @Transactional
    public List<String> confirmEnrollment(UUID userId, String code) {
        MfaTotpCredential credential = credentialRepository.findById(userId)
                .orElseThrow(() -> new MfaChallengeException("No hay un enrolamiento MFA pendiente"));

        byte[] secret = secretEncryptor.decrypt(credential.getSecretEncrypted());
        if (!totpService.verify(secret, code)) {
            throw new MfaChallengeException("Código MFA inválido");
        }

        credential.confirm();
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
