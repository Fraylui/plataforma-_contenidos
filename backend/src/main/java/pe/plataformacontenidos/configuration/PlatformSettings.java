package pe.plataformacontenidos.configuration;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

/**
 * Fila única de configuración de marca/identidad (CONTEXTO.md sección 14).
 * La unicidad se garantiza a nivel de base de datos (constraint UNIQUE sobre
 * singletonGuard, ver V11__platform_settings.sql), no aquí: esta clase es un
 * mapeo directo de esa fila. V73 (2026-10-21) quitó los campos sin uso y los
 * duplicados (descripción e imagen «SEO») y sumó las redes oficiales.
 */
@Entity
@Table(name = "platform_settings", schema = "configuration")
public class PlatformSettings {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "singleton_guard", nullable = false)
    private Boolean singletonGuard = Boolean.TRUE;

    @Column(nullable = false)
    private String name;

    /** Una o dos frases: inicio del sitio en Google, al compartir y en el RSS. */
    private String description;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "logo_dark_url")
    private String logoDarkUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    /** Imagen al compartir el sitio (y la de respaldo cuando un contenido no tiene foto). */
    @Column(name = "og_image_url")
    private String ogImageUrl;

    /** Título en Google si debe ser distinto del nombre; null = el nombre. */
    @Column(name = "seo_default_title")
    private String seoDefaultTitle;

    @Column(name = "google_search_console_verification")
    private String googleSearchConsoleVerification;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "adsense_enabled", nullable = false)
    private boolean adsenseEnabled;

    @Column(name = "adsense_client_id")
    private String adsenseClientId;

    @Column(name = "analytics_id")
    private String analyticsId;

    /** Enlace del canal de WhatsApp (https://whatsapp.com/channel/…); null = sin botón. */
    @Column(name = "whatsapp_channel_url")
    private String whatsappChannelUrl;

    /** Redes oficiales de la plataforma (solo enlaces, sin APIs); null = no se muestra. */
    @Column(name = "youtube_url")
    private String youtubeUrl;

    @Column(name = "instagram_url")
    private String instagramUrl;

    @Column(name = "tiktok_url")
    private String tiktokUrl;

    @Column(name = "facebook_url")
    private String facebookUrl;

    @Column(name = "x_url")
    private String xUrl;

    /** País del sitio (ISO-2): qué celebraciones ve quien llega sin ubicación conocida. */
    @Column(name = "home_country", nullable = false)
    private String homeCountry = "PE";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    protected PlatformSettings() {
        // JPA
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getLogoDarkUrl() {
        return logoDarkUrl;
    }

    public void setLogoDarkUrl(String logoDarkUrl) {
        this.logoDarkUrl = logoDarkUrl;
    }

    public String getFaviconUrl() {
        return faviconUrl;
    }

    public void setFaviconUrl(String faviconUrl) {
        this.faviconUrl = faviconUrl;
    }

    public String getOgImageUrl() {
        return ogImageUrl;
    }

    public void setOgImageUrl(String ogImageUrl) {
        this.ogImageUrl = ogImageUrl;
    }

    public String getSeoDefaultTitle() {
        return seoDefaultTitle;
    }

    public void setSeoDefaultTitle(String seoDefaultTitle) {
        this.seoDefaultTitle = seoDefaultTitle;
    }

    public String getGoogleSearchConsoleVerification() {
        return googleSearchConsoleVerification;
    }

    public void setGoogleSearchConsoleVerification(String googleSearchConsoleVerification) {
        this.googleSearchConsoleVerification = googleSearchConsoleVerification;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public boolean isAdsenseEnabled() {
        return adsenseEnabled;
    }

    public void setAdsenseEnabled(boolean adsenseEnabled) {
        this.adsenseEnabled = adsenseEnabled;
    }

    public String getAdsenseClientId() {
        return adsenseClientId;
    }

    public void setAdsenseClientId(String adsenseClientId) {
        this.adsenseClientId = adsenseClientId;
    }

    public String getAnalyticsId() {
        return analyticsId;
    }

    public void setAnalyticsId(String analyticsId) {
        this.analyticsId = analyticsId;
    }

    public String getWhatsappChannelUrl() {
        return whatsappChannelUrl;
    }

    public void setWhatsappChannelUrl(String whatsappChannelUrl) {
        this.whatsappChannelUrl = whatsappChannelUrl;
    }

    public String getYoutubeUrl() {
        return youtubeUrl;
    }

    public void setYoutubeUrl(String youtubeUrl) {
        this.youtubeUrl = youtubeUrl;
    }

    public String getInstagramUrl() {
        return instagramUrl;
    }

    public void setInstagramUrl(String instagramUrl) {
        this.instagramUrl = instagramUrl;
    }

    public String getTiktokUrl() {
        return tiktokUrl;
    }

    public void setTiktokUrl(String tiktokUrl) {
        this.tiktokUrl = tiktokUrl;
    }

    public String getFacebookUrl() {
        return facebookUrl;
    }

    public void setFacebookUrl(String facebookUrl) {
        this.facebookUrl = facebookUrl;
    }

    public String getXUrl() {
        return xUrl;
    }

    public void setXUrl(String xUrl) {
        this.xUrl = xUrl;
    }

    public String getHomeCountry() {
        return homeCountry;
    }

    public void setHomeCountry(String homeCountry) {
        this.homeCountry = homeCountry;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }
}
