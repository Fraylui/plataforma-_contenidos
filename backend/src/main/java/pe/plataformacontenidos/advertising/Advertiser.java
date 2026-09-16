package pe.plataformacontenidos.advertising;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/**
 * Empresa/negocio local que compra publicidad directa (banner), a diferencia
 * de AdSense que es el operador quien la vende. Solo datos de contacto: no
 * hay portal de anunciante ni facturación (fuera de alcance, ver plan) — el
 * dueño gestiona el trato y carga la campaña él mismo.
 */
@Entity
@Table(name = "advertisers", schema = "advertising")
public class Advertiser {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Advertiser() {
        // JPA
    }

    public Advertiser(String name, String contactEmail, String contactPhone) {
        this.name = name;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void update(String name, String contactEmail, String contactPhone) {
        this.name = name;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.updatedAt = Instant.now();
    }
}
