package pe.plataformacontenidos.shared;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Nombres de región comparables: lo que escribe el panel («Ayacucho») contra
 * lo que manda Cloudflare (CF-Region «Región de Ayacucho», CF-Region-Code
 * «AYA»). Lo usan la segmentación de anuncios (CampaignTargeting) y el
 * alcance de las celebraciones.
 */
public final class RegionNames {

    private static final Pattern MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern REGION_NOISE = Pattern.compile(
            "^(region|departamento|department|provincia|province|estado|state)( de)? | (region|department|province)$");
    private static final Pattern COUNTRY_CODE = Pattern.compile("[A-Z]{2}");

    private RegionNames() {
    }

    /** "Región de Ayacucho" / "Ayacucho Region" / "ayacucho" → "ayacucho". */
    public static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String plain = MARKS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD)).replaceAll("")
                .toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
        return REGION_NOISE.matcher(plain).replaceAll("").trim();
    }

    /** ¿La región configurada es la del visitante (por nombre o por código)? */
    public static boolean matches(String configured, String visitorRegion, String visitorRegionCode) {
        String wanted = normalize(configured);
        return !wanted.isEmpty() && (wanted.equals(normalize(visitorRegion)) || wanted.equals(normalize(visitorRegionCode)));
    }

    /**
     * País de CF-IPCountry en mayúsculas, o null si no es un país: falta la
     * cabecera, o Cloudflare manda "XX" (desconocido) o "T1" (Tor).
     */
    public static String visitorCountry(String header) {
        if (header == null) {
            return null;
        }
        String code = header.trim().toUpperCase(Locale.ROOT);
        return COUNTRY_CODE.matcher(code).matches() && !"XX".equals(code) ? code : null;
    }

    /** Código de país del panel en mayúsculas; null si no tiene la forma ISO de 2 letras. */
    public static String countryCode(String value) {
        String code = value.trim().toUpperCase(Locale.ROOT);
        return COUNTRY_CODE.matcher(code).matches() ? code : null;
    }
}
