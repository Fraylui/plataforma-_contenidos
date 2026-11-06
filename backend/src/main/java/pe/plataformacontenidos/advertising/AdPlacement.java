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
 * Posición de anuncio configurable (CONTEXTO.md sección 43.2). `key` es el
 * identificador estable que el frontend pasa a `<AdBlock position="..." />`
 * (ver ad-block.tsx) — crear una posición nueva es agregar una fila acá, no
 * una migración. `adsenseSlotId` puede quedar vacío hasta que el admin lo
 * complete; el frontend no renderiza nada mientras esté vacío o `enabled`
 * sea falso (mismo comportamiento que las dos posiciones fijas que existían
 * antes en PlatformSettings).
 */
@Entity
@Table(name = "ad_placements", schema = "advertising")
public class AdPlacement {

    /** Rectángulo medio (300×250): el formato más vendido y el que encaja en feed, columna lateral y contenido. */
    public static final int DEFAULT_WIDTH = 300;
    public static final int DEFAULT_HEIGHT = 250;

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private String key;

    @Column(nullable = false)
    private String label;

    @Column(name = "adsense_slot_id")
    private String adsenseSlotId;

    @Column(nullable = false)
    private boolean enabled = true;

    /** Medida de la creatividad en px CSS (tamaño estándar IAB, p. ej. 300×250): se muestra entera, nunca recortada. */
    @Column(nullable = false)
    private int width = DEFAULT_WIDTH;

    @Column(nullable = false)
    private int height = DEFAULT_HEIGHT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected AdPlacement() {
        // JPA
    }

    public AdPlacement(String key, String label, String adsenseSlotId, int width, int height) {
        this.key = key;
        this.label = label;
        this.adsenseSlotId = adsenseSlotId;
        this.width = width;
        this.height = height;
    }

    public UUID getId() {
        return id;
    }

    public String getKey() {
        return key;
    }

    public String getLabel() {
        return label;
    }

    public String getAdsenseSlotId() {
        return adsenseSlotId;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void update(String label, String adsenseSlotId, int width, int height) {
        this.label = label;
        this.adsenseSlotId = adsenseSlotId;
        this.width = width;
        this.height = height;
        this.updatedAt = Instant.now();
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
        this.updatedAt = Instant.now();
    }
}
