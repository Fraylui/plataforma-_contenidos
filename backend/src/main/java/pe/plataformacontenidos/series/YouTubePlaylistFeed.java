package pe.plataformacontenidos.series;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 * Lee el feed público de una lista de reproducción de YouTube
 * ({@code youtube.com/feeds/videos.xml?playlist_id=…}): sin clave de API ni
 * costo, trae los 15 videos más recientes con título, descripción y fecha.
 * Es una consulta de pocos KB por serie, así que no carga el VPS.
 *
 * <p>El XML viene de afuera: se parsea con DTD y entidades externas
 * desactivadas (OWASP, XXE).
 */
@Component
public class YouTubePlaylistFeed {

    private static final Pattern PLAYLIST_ID = Pattern.compile("^[A-Za-z0-9_-]{13,64}$");
    private static final Pattern LIST_PARAM = Pattern.compile("[?&]list=([A-Za-z0-9_-]{13,64})");
    private static final Pattern VIDEO_ID = Pattern.compile("^[A-Za-z0-9_-]{11}$");
    private static final String YT_NS = "http://www.youtube.com/xml/schemas/2015";
    private static final String MEDIA_NS = "http://search.yahoo.com/mrss/";
    private static final String ATOM_NS = "http://www.w3.org/2005/Atom";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public record FeedEntry(String videoId, String title, String description, Instant publishedAt) {
    }

    public record Feed(String title, List<FeedEntry> entries) {
    }

    /** Link de la lista (o el id suelto) → id de la lista; null si no se reconoce. */
    public static String playlistIdFrom(String input) {
        if (input == null) {
            return null;
        }
        String value = input.strip();
        Matcher param = LIST_PARAM.matcher(value);
        if (param.find()) {
            return param.group(1);
        }
        return PLAYLIST_ID.matcher(value).matches() ? value : null;
    }

    public Feed fetch(String playlistId) {
        HttpRequest request = HttpRequest.newBuilder(
                        URI.create("https://www.youtube.com/feeds/videos.xml?playlist_id=" + playlistId))
                .timeout(Duration.ofSeconds(10))
                .header("User-Agent", "plataforma-contenidos/1.0 (sincronizacion de series)")
                .GET()
                .build();
        try {
            HttpResponse<byte[]> response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() == 404) {
                throw new PlaylistFeedException("YouTube no encontró la lista (¿es privada o se borró?).");
            }
            if (response.statusCode() != 200) {
                throw new PlaylistFeedException("YouTube respondió " + response.statusCode() + ".");
            }
            return parse(response.body());
        } catch (IOException e) {
            throw new PlaylistFeedException("No se pudo conectar con YouTube.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new PlaylistFeedException("Se interrumpió la consulta a YouTube.");
        }
    }

    static Feed parse(byte[] xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xml));
            Element feed = doc.getDocumentElement();

            List<FeedEntry> entries = new ArrayList<>();
            NodeList entryNodes = feed.getElementsByTagNameNS(ATOM_NS, "entry");
            for (int i = 0; i < entryNodes.getLength(); i++) {
                Element entry = (Element) entryNodes.item(i);
                String videoId = text(entry, YT_NS, "videoId");
                String title = text(entry, ATOM_NS, "title");
                String published = text(entry, ATOM_NS, "published");
                if (videoId == null || !VIDEO_ID.matcher(videoId).matches() || title == null || published == null) {
                    continue;
                }
                entries.add(new FeedEntry(videoId, title, text(entry, MEDIA_NS, "description"), Instant.parse(published)));
            }
            return new Feed(directChild(feed, "title"), entries);
        } catch (ParserConfigurationException | SAXException | IOException | RuntimeException e) {
            throw new PlaylistFeedException("La respuesta de YouTube no tiene el formato esperado.");
        }
    }

    private static String text(Element parent, String ns, String name) {
        NodeList nodes = parent.getElementsByTagNameNS(ns, name);
        if (nodes.getLength() == 0) {
            return null;
        }
        String value = nodes.item(0).getTextContent();
        return value == null || value.isBlank() ? null : value.strip();
    }

    /** Título del feed (no el de una entrada): hijo directo de &lt;feed&gt;. */
    private static String directChild(Element parent, String name) {
        for (var node = parent.getFirstChild(); node != null; node = node.getNextSibling()) {
            if (node instanceof Element element && ATOM_NS.equals(element.getNamespaceURI())
                    && name.equals(element.getLocalName())) {
                String value = element.getTextContent();
                return value == null || value.isBlank() ? null : value.strip();
            }
        }
        return null;
    }
}
