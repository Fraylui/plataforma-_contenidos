package pe.plataformacontenidos.identity.mfa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mfa_totp", schema = "identity")
public class MfaTotpCredential {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "secret_encrypted", nullable = false)
    private String secretEncrypted;

    /**
     * Secreto nuevo mientras se rota el TOTP de una cuenta que YA tiene MFA
     * habilitado (ver MfaService.startEnrollment): se guarda acá, sin tocar
     * secretEncrypted/enabled, hasta que confirmEnrollment lo valida y lo
     * promueve. Evita dejar la cuenta sin MFA si el usuario abandona el
     * flujo de re-enrolamiento antes de confirmar.
     */
    @Column(name = "pending_secret_encrypted")
    private String pendingSecretEncrypted;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    protected MfaTotpCredential() {
        // JPA
    }

    public MfaTotpCredential(UUID userId, String secretEncrypted) {
        this.userId = userId;
        this.secretEncrypted = secretEncrypted;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getSecretEncrypted() {
        return secretEncrypted;
    }

    /** Solo para primer enrolamiento o uno abandonado sin confirmar (nunca sobre una credencial habilitada). */
    public void replaceSecret(String newSecretEncrypted) {
        this.secretEncrypted = newSecretEncrypted;
        this.pendingSecretEncrypted = null;
        this.enabled = false;
        this.confirmedAt = null;
    }

    /** Rotación de una credencial YA habilitada: no toca el secreto activo hasta confirmar. */
    public void stageRotation(String newSecretEncrypted) {
        this.pendingSecretEncrypted = newSecretEncrypted;
    }

    public boolean hasPendingSecret() {
        return pendingSecretEncrypted != null;
    }

    public String getPendingSecretEncrypted() {
        return pendingSecretEncrypted;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void confirm() {
        this.enabled = true;
        this.confirmedAt = Instant.now();
    }

    /** Confirma una rotación en curso: el secreto pendiente pasa a ser el activo. */
    public void promotePendingSecret() {
        this.secretEncrypted = this.pendingSecretEncrypted;
        this.pendingSecretEncrypted = null;
        this.enabled = true;
        this.confirmedAt = Instant.now();
    }

    public void disable() {
        this.enabled = false;
        this.pendingSecretEncrypted = null;
    }
}
