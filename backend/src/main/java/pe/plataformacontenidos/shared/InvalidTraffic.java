package pe.plataformacontenidos.shared;

import java.util.regex.Pattern;

/**
 * Filtro de tráfico inválido "general" (GIVT, en la terminología del MRC):
 * robots y clientes automáticos que se identifican como tales. Es el primer
 * filtro que aplica cualquier ad server antes de contar una impresión o un
 * clic — sin él, buscadores, previsualizadores de enlaces (WhatsApp,
 * Facebook, Slack) y scripts inflan las cifras que se le reportan al
 * anunciante. Sin user agent también se descarta: un navegador real siempre
 * lo manda. Lo usan los anuncios y el conteo de visitas.
 */
public final class InvalidTraffic {

    private static final Pattern AUTOMATED_AGENT = Pattern.compile(
            "bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp"
                    + "|telegram|curl|wget|python|java/|go-http|okhttp|axios|node-fetch|postman|httpclient|scrapy",
            Pattern.CASE_INSENSITIVE);

    private InvalidTraffic() {
    }

    public static boolean isAutomated(String userAgent) {
        return userAgent == null || userAgent.isBlank() || AUTOMATED_AGENT.matcher(userAgent).find();
    }
}
