package pe.plataformacontenidos.media;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Set;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Decodifica y REENCODEA cada imagen subida (nunca guarda los bytes
 * originales). Esto es una defensa deliberada, no solo una validación:
 *
 * - Neutraliza archivos "polyglot" (válidos simultáneamente como imagen y
 *   como otro formato ejecutable/script) — al reencodear solo sobreviven
 *   los píxeles decodificados.
 * - Elimina metadatos EXIF (incluida geolocalización GPS de fotos de
 *   colaboradores — relevante para CONTEXTO.md sección 7).
 *
 * Solo JPEG y PNG en el MVP: GIF perdería la animación al reencodear con
 * ImageIO (que solo escribe el primer frame) y WebP no tiene decoder
 * nativo en el JDK sin sumar una dependencia — decisión señalada, no
 * silenciosa.
 */
@Component
@EnableConfigurationProperties(MediaProperties.class)
public class ImageProcessor {

    private static final Set<String> ALLOWED_FORMATS = Set.of("JPEG", "PNG");

    private final MediaProperties properties;

    public ImageProcessor(MediaProperties properties) {
        this.properties = properties;
    }

    public ProcessedImage process(byte[] rawBytes) {
        if (rawBytes.length == 0 || rawBytes.length > properties.maxFileSizeBytes()) {
            throw new InvalidImageException("El archivo excede el tamaño máximo permitido ("
                    + properties.maxFileSizeBytes() + " bytes)");
        }

        BufferedImage decoded;
        try {
            decoded = ImageIO.read(new ByteArrayInputStream(rawBytes));
        } catch (IOException e) {
            throw new InvalidImageException("No se pudo leer el archivo como imagen");
        }
        if (decoded == null) {
            throw new InvalidImageException("El archivo no es una imagen JPEG o PNG válida");
        }

        if (decoded.getWidth() > properties.maxDimensionPixels()
                || decoded.getHeight() > properties.maxDimensionPixels()) {
            throw new InvalidImageException(
                    "La imagen excede el tamaño máximo de " + properties.maxDimensionPixels() + "px por lado");
        }

        String format = detectFormat(rawBytes);
        if (!ALLOWED_FORMATS.contains(format)) {
            throw new InvalidImageException("Formato no soportado: " + format + " (solo JPEG o PNG)");
        }

        BufferedImage stored = downscaleToFit(decoded, properties.maxStoredDimensionPixels());
        byte[] reencoded = reencode(stored, format);
        String contentType = format.equals("JPEG") ? "image/jpeg" : "image/png";
        String extension = format.equals("JPEG") ? "jpg" : "png";

        return new ProcessedImage(reencoded, contentType, extension, stored.getWidth(), stored.getHeight());
    }

    /**
     * Reduce la imagen para que su lado más largo no pase de {@code maxSide}
     * (manteniendo la proporción); si ya entra, la devuelve tal cual. Se
     * reduce a la mitad por pasos y recién el último paso va al tamaño
     * exacto: escalar 6000px→2560px de un solo salto con interpolación
     * bilineal saltea píxeles y deja bordes dentados (aliasing).
     */
    static BufferedImage downscaleToFit(BufferedImage source, int maxSide) {
        int longest = Math.max(source.getWidth(), source.getHeight());
        if (maxSide <= 0 || longest <= maxSide) {
            return source;
        }
        double ratio = (double) maxSide / longest;
        int targetWidth = Math.max(1, (int) Math.round(source.getWidth() * ratio));
        int targetHeight = Math.max(1, (int) Math.round(source.getHeight() * ratio));
        int type = source.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;

        BufferedImage current = source;
        int width = source.getWidth();
        int height = source.getHeight();
        do {
            width = Math.max(targetWidth, width / 2);
            height = Math.max(targetHeight, height / 2);
            BufferedImage step = new BufferedImage(width, height, type);
            Graphics2D g = step.createGraphics();
            try {
                g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g.drawImage(current, 0, 0, width, height, null);
            } finally {
                g.dispose();
            }
            current = step;
        } while (width != targetWidth || height != targetHeight);
        return current;
    }

    private String detectFormat(byte[] rawBytes) {
        try (var iis = ImageIO.createImageInputStream(new ByteArrayInputStream(rawBytes))) {
            var readers = ImageIO.getImageReaders(iis);
            if (!readers.hasNext()) {
                throw new InvalidImageException("No se reconoce el formato del archivo");
            }
            return readers.next().getFormatName().toUpperCase();
        } catch (IOException e) {
            throw new InvalidImageException("No se pudo determinar el formato del archivo");
        }
    }

    private byte[] reencode(BufferedImage image, String format) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (format.equals("JPEG")) {
                // JPEG no soporta canal alfa: aplanar sobre fondo blanco si la fuente lo trae (ej. PNG mal detectado)
                BufferedImage rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
                rgb.createGraphics().drawImage(image, 0, 0, java.awt.Color.WHITE, null);
                writeJpeg(rgb, out);
            } else {
                ImageIO.write(image, "png", out);
            }
            return out.toByteArray();
        } catch (IOException e) {
            throw new InvalidImageException("No se pudo procesar la imagen");
        }
    }

    private void writeJpeg(BufferedImage image, ByteArrayOutputStream out) throws IOException {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(0.9f);
        try (var ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
    }

    public record ProcessedImage(byte[] content, String contentType, String extension, int width, int height) {
    }
}
