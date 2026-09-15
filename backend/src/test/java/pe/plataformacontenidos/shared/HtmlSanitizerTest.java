package pe.plataformacontenidos.shared;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HtmlSanitizerTest {

    @Test
    void keepsAllowedFormattingTags() {
        String input = "<p>Hola <strong>mundo</strong> <em>en cursiva</em></p><h2>Subtítulo</h2><ul><li>Uno</li></ul>";
        assertThat(HtmlSanitizer.sanitize(input)).isEqualTo(input);
    }

    @Test
    void stripsScriptTags() {
        String input = "<p>Hola</p><script>alert(1)</script>";
        assertThat(HtmlSanitizer.sanitize(input)).doesNotContain("<script");
        assertThat(HtmlSanitizer.sanitize(input)).doesNotContain("alert");
    }

    @Test
    void stripsInlineEventHandlers() {
        String input = "<p onclick=\"alert(1)\">Hola</p>";
        String sanitized = HtmlSanitizer.sanitize(input);
        assertThat(sanitized).doesNotContain("onclick");
        assertThat(sanitized).doesNotContain("alert");
    }

    @Test
    void stripsDisallowedElementsButKeepsText() {
        String input = "<p>Hola</p><iframe src=\"https://evil.example\"></iframe>";
        String sanitized = HtmlSanitizer.sanitize(input);
        assertThat(sanitized).doesNotContain("<iframe");
        assertThat(sanitized).contains("Hola");
    }

    @Test
    void allowsLinksAndAddsRelNofollow() {
        String input = "<p><a href=\"https://example.com\">enlace</a></p>";
        String sanitized = HtmlSanitizer.sanitize(input);
        assertThat(sanitized).contains("href=\"https://example.com\"");
        assertThat(sanitized).contains("nofollow");
    }

    @Test
    void rejectsJavascriptProtocolLinks() {
        String input = "<p><a href=\"javascript:alert(1)\">enlace</a></p>";
        String sanitized = HtmlSanitizer.sanitize(input);
        assertThat(sanitized).doesNotContain("javascript:");
    }

    @Test
    void keepsInlineImages() {
        String input = "<p>Antes</p><img src=\"https://example.com/foto.jpg\" alt=\"Descripción\"><p>Después</p>";
        String sanitized = HtmlSanitizer.sanitize(input);
        assertThat(sanitized).contains("<img");
        assertThat(sanitized).contains("src=\"https://example.com/foto.jpg\"");
        assertThat(sanitized).contains("alt=\"Descripción\"");
    }

    @Test
    void rejectsJavascriptProtocolImageSrc() {
        String input = "<img src=\"javascript:alert(1)\" alt=\"x\">";
        String sanitized = HtmlSanitizer.sanitize(input);
        assertThat(sanitized).doesNotContain("javascript:");
    }
}
