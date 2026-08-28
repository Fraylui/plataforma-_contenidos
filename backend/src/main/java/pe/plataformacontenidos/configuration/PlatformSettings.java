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
 * mapeo directo de esa fila.
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

    @Column(name = "short_name")
    private String shortName;

    private String description;
    private String slogan;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "logo_dark_url")
    private String logoDarkUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "og_image_url")
    private String ogImageUrl;

    @Column(name = "primary_color")
    private String primaryColor;

    @Column(name = "secondary_color")
    private String secondaryColor;

    @Column(name = "background_color")
    private String backgroundColor;

    @Column(name = "font_family")
    private String fontFamily;

    @Column(nullable = false)
    private String theme;

    @Column(name = "seo_default_title")
    private String seoDefaultTitle;

    @Column(name = "seo_default_description")
    private String seoDefaultDescription;

    @Column(name = "seo_default_image_url")
    private String seoDefaultImageUrl;

    @Column(name = "google_search_console_verification")
    private String googleSearchConsoleVerification;

    @Column(name = "facebook_url")
    private String facebookUrl;

    @Column(name = "instagram_url")
    private String instagramUrl;

    @Column(name = "tiktok_url")
    private String tiktokUrl;

    @Column(name = "youtube_url")
    private String youtubeUrl;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "contact_address")
    private String contactAddress;

    @Column(name = "adsense_enabled", nullable = false)
    private boolean adsenseEnabled;

    @Column(name = "adsense_client_id")
    private String adsenseClientId;

    @Column(name = "analytics_id")
    private String analyticsId;

    @Column(name = "adsense_slot_article")
    private String adsenseSlotArticle;

    @Column(name = "adsense_slot_listing")
    private String adsenseSlotListing;

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

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSlogan() {
        return slogan;
    }

    public void setSlogan(String slogan) {
        this.slogan = slogan;
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

    public String getPrimaryColor() {
        return primaryColor;
    }

    public void setPrimaryColor(String primaryColor) {
        this.primaryColor = primaryColor;
    }

    public String getSecondaryColor() {
        return secondaryColor;
    }

    public void setSecondaryColor(String secondaryColor) {
        this.secondaryColor = secondaryColor;
    }

    public String getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(String backgroundColor) {
        this.backgroundColor = backgroundColor;
    }

    public String getFontFamily() {
        return fontFamily;
    }

    public void setFontFamily(String fontFamily) {
        this.fontFamily = fontFamily;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getSeoDefaultTitle() {
        return seoDefaultTitle;
    }

    public void setSeoDefaultTitle(String seoDefaultTitle) {
        this.seoDefaultTitle = seoDefaultTitle;
    }

    public String getSeoDefaultDescription() {
        return seoDefaultDescription;
    }

    public void setSeoDefaultDescription(String seoDefaultDescription) {
        this.seoDefaultDescription = seoDefaultDescription;
    }

    public String getSeoDefaultImageUrl() {
        return seoDefaultImageUrl;
    }

    public void setSeoDefaultImageUrl(String seoDefaultImageUrl) {
        this.seoDefaultImageUrl = seoDefaultImageUrl;
    }

    public String getGoogleSearchConsoleVerification() {
        return googleSearchConsoleVerification;
    }

    public void setGoogleSearchConsoleVerification(String googleSearchConsoleVerification) {
        this.googleSearchConsoleVerification = googleSearchConsoleVerification;
    }

    public String getFacebookUrl() {
        return facebookUrl;
    }

    public void setFacebookUrl(String facebookUrl) {
        this.facebookUrl = facebookUrl;
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

    public String getYoutubeUrl() {
        return youtubeUrl;
    }

    public void setYoutubeUrl(String youtubeUrl) {
        this.youtubeUrl = youtubeUrl;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactAddress() {
        return contactAddress;
    }

    public void setContactAddress(String contactAddress) {
        this.contactAddress = contactAddress;
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

    public String getAdsenseSlotArticle() {
        return adsenseSlotArticle;
    }

    public void setAdsenseSlotArticle(String adsenseSlotArticle) {
        this.adsenseSlotArticle = adsenseSlotArticle;
    }

    public String getAdsenseSlotListing() {
        return adsenseSlotListing;
    }

    public void setAdsenseSlotListing(String adsenseSlotListing) {
        this.adsenseSlotListing = adsenseSlotListing;
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
