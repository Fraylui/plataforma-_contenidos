package pe.plataformacontenidos.feed;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import pe.plataformacontenidos.catalog.ContentRegistry;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.feed.api.dto.FeedItemResponse;
import pe.plataformacontenidos.identity.permission.Module;

class FeedCandidateCacheTest {

    private static final Instant T0 = Instant.parse("2026-10-07T12:00:00Z");

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final MutableClock clock = new MutableClock(T0);
    private final ContentRegistry contents = new ContentRegistry(List.of(
            ContentSource.of("places.places", Module.PLACES).type(ContentType.PLACE).versionsFeed().build(),
            ContentSource.of("series.series", Module.SERIES).versionsFeed().build(),
            ContentSource.of("series.episodes", Module.SERIES).type(ContentType.EPISODE).build()));
    private final FeedCandidateCache cache = new FeedCandidateCache(jdbc, contents, clock);
    private final AtomicInteger builds = new AtomicInteger();

    private List<FeedItemResponse> build() {
        builds.incrementAndGet();
        return List.of();
    }

    private void contentVersion(Instant version) {
        when(jdbc.queryForObject(anyString(), eq(Timestamp.class))).thenReturn(Timestamp.from(version));
    }

    @Test
    void theVersionComesFromEveryTableThatVersionsTheFeed() {
        contentVersion(T0);
        cache.candidates(null, this::build);
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForObject(sql.capture(), eq(Timestamp.class));
        assertThat(sql.getValue()).isEqualTo("select greatest((select max(updated_at) from places.places),"
                + " (select max(updated_at) from series.series))");
    }

    @Test
    void reusesCandidatesWhileVersionAndAgeHold() {
        contentVersion(T0);
        cache.candidates(null, this::build);
        clock.advance(Duration.ofSeconds(29));
        cache.candidates(null, this::build);
        assertThat(builds).hasValue(1);
    }

    @Test
    void rebuildsAtOnceWhenContentChanges() {
        contentVersion(T0);
        cache.candidates(null, this::build);
        contentVersion(T0.plusSeconds(1));
        cache.candidates(null, this::build);
        assertThat(builds).hasValue(2);
    }

    @Test
    void rebuildsAfterMaxAgeForLikesAndEndedCelebrations() {
        contentVersion(T0);
        cache.candidates(null, this::build);
        clock.advance(FeedCandidateCache.MAX_AGE.plusSeconds(1));
        cache.candidates(null, this::build);
        assertThat(builds).hasValue(2);
    }

    @Test
    void eachTypeHasItsOwnCandidates() {
        contentVersion(T0);
        cache.candidates(null, this::build);
        cache.candidates(ContentType.CELEBRATION, this::build);
        cache.candidates(ContentType.CELEBRATION, this::build);
        assertThat(builds).hasValue(2);
    }

    @Test
    void emptyDatabaseHasNoVersionAndStillCaches() {
        when(jdbc.queryForObject(anyString(), eq(Timestamp.class))).thenReturn(null);
        cache.candidates(null, this::build);
        cache.candidates(null, this::build);
        assertThat(builds).hasValue(1);
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }
    }
}
