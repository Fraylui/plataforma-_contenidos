package pe.plataformacontenidos.media;

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

        byte[] reencoded = reencode(decoded, format);
        String contentType = format.equals("JPEG") ? "image/jpeg" : "image/png";
        String extension = format.equals("JPEG") ? "jpg" : "png";

        return new ProcessedImage(reencoded, contentType, extension, decoded.getWidth(), decoded.getHeight());
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
