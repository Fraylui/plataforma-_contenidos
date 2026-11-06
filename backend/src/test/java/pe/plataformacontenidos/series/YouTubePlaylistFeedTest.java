package pe.plataformacontenidos.series;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class YouTubePlaylistFeedTest {

    static final String FEED = """
            <?xml version="1.0" encoding="UTF-8"?>
            <feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/"
                  xmlns="http://www.w3.org/2005/Atom">
              <title>Curiosidades del mundo</title>
              <entry>
                <yt:videoId>dQw4w9WgXcQ</yt:videoId>
                <title>Episodio 2: Machu Picchu</title>
                <published>2026-10-10T15:00:00+00:00</published>
                <media:group><media:description>La ciudad inca.</media:description></media:group>
              </entry>
              <entry>
                <yt:videoId>malo</yt:videoId>
                <title>Id inválido: se ignora</title>
                <published>2026-10-09T15:00:00+00:00</published>
              </entry>
              <entry>
                <yt:videoId>aBcDeFgHiJk</yt:videoId>
                <title>Episodio 1: Nazca</title>
                <published>2026-10-01T15:00:00+00:00</published>
              </entry>
            </feed>
            """;

    @Test
    void readsTitleAndValidEntries() {
        YouTubePlaylistFeed.Feed feed = YouTubePlaylistFeed.parse(FEED.getBytes(StandardCharsets.UTF_8));

        assertThat(feed.title()).isEqualTo("Curiosidades del mundo");
        assertThat(feed.entries()).extracting(YouTubePlaylistFeed.FeedEntry::videoId)
                .containsExactly("dQw4w9WgXcQ", "aBcDeFgHiJk");
        assertThat(feed.entries().get(0).description()).isEqualTo("La ciudad inca.");
        assertThat(feed.entries().get(0).publishedAt()).isEqualTo(Instant.parse("2026-10-10T15:00:00Z"));
    }

    @Test
    void rejectsXmlWithDoctypeToBlockXxe() {
        String evil = """
                <?xml version="1.0"?>
                <!DOCTYPE feed [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
                <feed xmlns="http://www.w3.org/2005/Atom"><title>&xxe;</title></feed>
                """;
        assertThatThrownBy(() -> YouTubePlaylistFeed.parse(evil.getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(PlaylistFeedException.class);
    }

    @Test
    void recognizesPlaylistLinksAndIds() {
        assertThat(YouTubePlaylistFeed.playlistIdFrom("https://www.youtube.com/playlist?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG"))
                .isEqualTo("PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG");
        assertThat(YouTubePlaylistFeed.playlistIdFrom("https://youtube.com/watch?v=dQw4w9WgXcQ&list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG&index=2"))
                .isEqualTo("PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG");
        assertThat(YouTubePlaylistFeed.playlistIdFrom("PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG"))
                .isEqualTo("PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG");
        assertThat(YouTubePlaylistFeed.playlistIdFrom("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).isNull();
        assertThat(YouTubePlaylistFeed.playlistIdFrom("hola")).isNull();
    }
}
