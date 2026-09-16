package pe.plataformacontenidos.advertising;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;
import pe.plataformacontenidos.shared.ContentImage;

/**
 * Banner directo vendido a un {@link Advertiser} para una posición existente
 * (`placementKey`, referencia libre a AdPlacement.key — igual que
 * Article.categoryId, sin FK entre schemas de dominio, validado en
 * CampaignService). Mientras haya una campaña activa y vigente para una
 * posición, AdBlock la muestra en vez de caer a AdSense (frontend).
 * `creative` reutiliza el mismo patrón XOR (subida o enlace externo) que
 * ContentImage — el campo `title` de ese embeddable hace de alt text.
 */
@Entity
@Table(name = "campaigns", schema = "advertising")
public class Campaign {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "advertiser_id", nullable = false)
    private UUID advertiserId;

    @Column(name = "placement_key", nullable = false)
    private String placementKey;

    @Embedded
    private ContentImage creative;

    @Column(name = "link_url", nullable = false)
    private String linkUrl;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "impression_count", nullable = false)
    private long impressionCount = 0;

    @Column(name = "click_count", nullable = false)
    private long clickCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Campaign() {
        // JPA
    }

    public Campaign(UUID advertiserId, String placementKey, ContentImage creative, String linkUrl, Instant startsAt,
            Instant endsAt) {
        this.advertiserId = advertiserId;
        this.placementKey = placementKey;
        this.creative = creative;
        this.linkUrl = linkUrl;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getAdvertiserId() {
        return advertiserId;
    }

    public String getPlacementKey() {
        return placementKey;
    }

    public ContentImage getCreative() {
        return creative;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public boolean isActive() {
        return active;
    }

    public long getImpressionCount() {
        return impressionCount;
    }

    public long getClickCount() {
        return clickCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void update(String placementKey, ContentImage creative, String linkUrl, Instant startsAt,
            Instant endsAt) {
        this.placementKey = placementKey;
        this.creative = creative;
        this.linkUrl = linkUrl;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.updatedAt = Instant.now();
    }

    public void setActive(boolean active) {
        this.active = active;
        this.updatedAt = Instant.now();
    }

    public void recordImpression() {
        this.impressionCount++;
    }

    public void recordClick() {
        this.clickCount++;
    }

    /** Vigente = activa y, si tiene fechas, dentro del rango. Sin fechas de inicio/fin, corre indefinidamente. */
    public boolean isCurrentlyServable(Instant now) {
        if (!active) {
            return false;
        }
        if (startsAt != null && now.isBefore(startsAt)) {
            return false;
        }
        return endsAt == null || !now.isAfter(endsAt);
    }
}
