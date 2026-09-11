package pe.plataformacontenidos.shared;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

/**
 * Sanitiza HTML generado por el editor rico (Tiptap) antes de persistirlo —
 * nunca confiar en que el frontend ya limpió el HTML, el request puede no
 * venir del formulario admin. Policy deliberadamente mínima: solo lo que la
 * toolbar del editor puede producir, nada de script/style/iframe/eventos
 * inline. Si se agrega una función nueva a la toolbar (ej. tablas), hay que
 * extender esta policy primero o el contenido se guarda sin ese tag.
 */
public final class HtmlSanitizer {

    private static final PolicyFactory POLICY = new HtmlPolicyBuilder()
            .allowElements("p", "br", "strong", "em", "u", "h2", "h3", "ul", "ol", "li", "blockquote", "a")
            .allowAttributes("href").onElements("a")
            .requireRelNofollowOnLinks()
            .allowUrlProtocols("http", "https", "mailto")
            .toFactory();

    private HtmlSanitizer() {
    }

    public static String sanitize(String html) {
        return POLICY.sanitize(html);
    }
}
