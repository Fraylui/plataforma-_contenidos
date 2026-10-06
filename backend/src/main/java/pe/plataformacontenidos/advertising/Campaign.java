package pe.plataformacontenidos.advertising;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
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

    /** Peso de rotación por defecto, a mitad de la escala 1–10 (ver CampaignRotation). */
    public static final int DEFAULT_WEIGHT = 5;

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

    /** Solo registro contable de lo cobrado — sin facturación/pagos, ver plan de Publicidad directa. */
    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 3)
    private String currency;

    @Column(nullable = false)
    private boolean active = true;

    /** 1–10: con varias campañas en la misma posición, cuánto más seguido sale esta (selección ponderada). */
    @Column(nullable = false)
    private int weight = DEFAULT_WEIGHT;

    // Segmentación (ver CampaignTargeting): arrays de Postgres, vacíos = sin restricción.
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "target_sections", nullable = false, columnDefinition = "text[]")
    private String[] targetSections = new String[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "target_category_ids", nullable = false, columnDefinition = "uuid[]")
    private UUID[] targetCategoryIds = new UUID[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "target_countries", nullable = false, columnDefinition = "text[]")
    private String[] targetCountries = new String[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "target_regions", nullable = false, columnDefinition = "text[]")
    private String[] targetRegions = new String[0];

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
            Instant endsAt, BigDecimal amount, String currency, int weight, CampaignTargeting targeting) {
        this.advertiserId = advertiserId;
        this.placementKey = placementKey;
        this.creative = creative;
        this.linkUrl = linkUrl;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.amount = amount;
        this.currency = currency;
        this.weight = weight;
        setTargeting(targeting);
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

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCurrency() {
        return currency;
    }

    public boolean isActive() {
        return active;
    }

    public int getWeight() {
        return weight;
    }

    public CampaignTargeting getTargeting() {
        return new CampaignTargeting(
                Arrays.stream(targetSections).map(AdSection::valueOf).collect(Collectors.toSet()),
                Set.of(targetCategoryIds), Set.of(targetCountries), Set.of(targetRegions));
    }

    private void setTargeting(CampaignTargeting targeting) {
        this.targetSections = targeting.sections().stream().map(Enum::name).sorted().toArray(String[]::new);
        this.targetCategoryIds = targeting.categoryIds().toArray(UUID[]::new);
        this.targetCountries = targeting.countries().stream().sorted().toArray(String[]::new);
        this.targetRegions = targeting.regions().stream().sorted().toArray(String[]::new);
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
            Instant endsAt, BigDecimal amount, String currency, int weight, CampaignTargeting targeting) {
        this.placementKey = placementKey;
        this.creative = creative;
        this.linkUrl = linkUrl;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
        this.amount = amount;
        this.currency = currency;
        this.weight = weight;
        setTargeting(targeting);
        this.updatedAt = Instant.now();
    }

    public void setActive(boolean active) {
        this.active = active;
        this.updatedAt = Instant.now();
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
