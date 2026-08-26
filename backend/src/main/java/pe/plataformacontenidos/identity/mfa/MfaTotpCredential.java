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

    public void replaceSecret(String newSecretEncrypted) {
        this.secretEncrypted = newSecretEncrypted;
        this.enabled = false;
        this.confirmedAt = null;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void confirm() {
        this.enabled = true;
        this.confirmedAt = Instant.now();
    }

    public void disable() {
        this.enabled = false;
    }
}
