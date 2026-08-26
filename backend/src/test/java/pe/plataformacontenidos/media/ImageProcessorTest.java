package pe.plataformacontenidos.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

class ImageProcessorTest {

    private final MediaProperties defaultProperties = new MediaProperties("unused", 10_000_000, 6000, 30, 15);
    private final ImageProcessor processor = new ImageProcessor(defaultProperties);

    @Test
    void validPngRoundTripsWithCorrectDimensions() throws Exception {
        byte[] png = pngOf(50, 25);

        var result = processor.process(png);

        assertThat(result.width()).isEqualTo(50);
        assertThat(result.height()).isEqualTo(25);
        assertThat(result.contentType()).isEqualTo("image/png");
        assertThat(result.extension()).isEqualTo("png");
        assertThat(ImageIO.read(new java.io.ByteArrayInputStream(result.content()))).isNotNull();
    }

    @Test
    void garbageBytesAreRejected() {
        byte[] garbage = "esto definitivamente no es una imagen".getBytes();

        assertThatThrownBy(() -> processor.process(garbage)).isInstanceOf(InvalidImageException.class);
    }

    @Test
    void emptyFileIsRejected() {
        assertThatThrownBy(() -> processor.process(new byte[0])).isInstanceOf(InvalidImageException.class);
    }

    @Test
    void imageExceedingMaxDimensionIsRejected() throws Exception {
        MediaProperties tightProperties = new MediaProperties("unused", 10_000_000, 10, 30, 15);
        ImageProcessor tightProcessor = new ImageProcessor(tightProperties);
        byte[] png = pngOf(20, 20);

        assertThatThrownBy(() -> tightProcessor.process(png)).isInstanceOf(InvalidImageException.class);
    }

    @Test
    void fileExceedingMaxSizeIsRejected() throws Exception {
        MediaProperties tightProperties = new MediaProperties("unused", 10, 6000, 30, 15);
        ImageProcessor tightProcessor = new ImageProcessor(tightProperties);
        byte[] png = pngOf(50, 50);

        assertThatThrownBy(() -> tightProcessor.process(png)).isInstanceOf(InvalidImageException.class);
    }

    @Test
    void jpegIsAcceptedAndReencoded() throws Exception {
        BufferedImage image = new BufferedImage(30, 30, BufferedImage.TYPE_INT_RGB);
        image.createGraphics().setColor(Color.RED);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", out);

        var result = processor.process(out.toByteArray());

        assertThat(result.contentType()).isEqualTo("image/jpeg");
        assertThat(result.extension()).isEqualTo("jpg");
    }

    private byte[] pngOf(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setColor(Color.GREEN);
        graphics.fillRect(0, 0, width, height);
        graphics.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }
}
