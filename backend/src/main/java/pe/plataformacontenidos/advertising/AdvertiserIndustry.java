package pe.plataformacontenidos.advertising;

/**
 * Rubro del anunciante. Los regulados obligan a una advertencia en el propio
 * anuncio: el panel la recuerda al armar la campaña (textos en el frontend,
 * lib/ads/industry.ts).
 */
public enum AdvertiserIndustry {
    GENERAL,
    /** Alimentos procesados: octógonos (Ley 30021). */
    PROCESSED_FOOD,
    /** Bebidas alcohólicas: advertencia sanitaria (Ley 28681). */
    ALCOHOL,
    /** Apuestas deportivas y casinos a distancia: +18 y juego responsable (Ley 31557). */
    BETTING
}
