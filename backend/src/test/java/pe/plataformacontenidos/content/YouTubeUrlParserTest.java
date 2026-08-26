package pe.plataformacontenidos.content;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class YouTubeUrlParserTest {

    @Test
    void extractsIdFromStandardWatchUrl() {
        assertThat(YouTubeUrlParser.extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
                .contains("dQw4w9WgXcQ");
    }

    @Test
    void extractsIdFromShortUrl() {
        assertThat(YouTubeUrlParser.extractVideoId("https://youtu.be/dQw4w9WgXcQ")).contains("dQw4w9WgXcQ");
    }

    @Test
    void extractsIdFromEmbedUrl() {
        assertThat(YouTubeUrlParser.extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"))
                .contains("dQw4w9WgXcQ");
    }

    @Test
    void extractsIdFromShortsUrl() {
        assertThat(YouTubeUrlParser.extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"))
                .contains("dQw4w9WgXcQ");
    }

    @Test
    void extractsIdWithExtraQueryParams() {
        assertThat(YouTubeUrlParser.extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s"))
                .contains("dQw4w9WgXcQ");
    }

    @Test
    void rejectsNonYouTubeUrl() {
        assertThat(YouTubeUrlParser.extractVideoId("https://vimeo.com/12345678")).isEmpty();
    }

    @Test
    void rejectsBlankOrNull() {
        assertThat(YouTubeUrlParser.extractVideoId("")).isEmpty();
        assertThat(YouTubeUrlParser.extractVideoId(null)).isEmpty();
    }

    @Test
    void validatesVideoIdFormat() {
        assertThat(YouTubeUrlParser.isValidVideoId("dQw4w9WgXcQ")).isTrue();
        assertThat(YouTubeUrlParser.isValidVideoId("demasiado-largo-para-ser-un-id")).isFalse();
        assertThat(YouTubeUrlParser.isValidVideoId(null)).isFalse();
    }
}
