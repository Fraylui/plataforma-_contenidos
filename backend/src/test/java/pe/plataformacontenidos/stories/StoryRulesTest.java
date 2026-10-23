package pe.plataformacontenidos.stories;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.stories.StoryService.StoryItem;

class StoryRulesTest {

    private static final UUID IMAGE = UUID.randomUUID();

    private static StoryItem photo(String caption) {
        return new StoryItem(IMAGE, null, caption, Story.CaptionPosition.BOTTOM, null, null, null, false);
    }

    @Test
    void expiresTwentyFourHoursAfterPublishing() {
        Instant published = Instant.parse("2026-10-23T15:00:00Z");
        assertThat(StoryRules.expiryFor(published)).isEqualTo(published.plus(Duration.ofHours(24)));
    }

    @Test
    void acceptsABatchOfTen() {
        StoryRules.validateBatch(Collections.nCopies(10, photo("Hola")));
    }

    @Test
    void rejectsMoreThanTenItems() {
        assertThatThrownBy(() -> StoryRules.validateBatch(Collections.nCopies(11, photo(null))))
                .isInstanceOf(InvalidStoryException.class).hasMessageContaining("10");
    }

    @Test
    void rejectsAnEmptyBatch() {
        assertThatThrownBy(() -> StoryRules.validateBatch(List.of())).isInstanceOf(InvalidStoryException.class);
    }

    @Test
    void rejectsCaptionOver140() {
        assertThatThrownBy(() -> StoryRules.validateItem(photo("a".repeat(141))))
                .isInstanceOf(InvalidStoryException.class).hasMessageContaining("140");
        StoryRules.validateItem(photo("a".repeat(140)));
    }

    @Test
    void rejectsImageAndBackgroundTogether() {
        StoryItem both = new StoryItem(IMAGE, Story.Background.SUNSET, "x", Story.CaptionPosition.TOP, null, null, null, false);
        assertThatThrownBy(() -> StoryRules.validateItem(both)).isInstanceOf(InvalidStoryException.class);
    }

    @Test
    void rejectsNeitherImageNorBackground() {
        StoryItem none = new StoryItem(null, null, "x", Story.CaptionPosition.TOP, null, null, null, false);
        assertThatThrownBy(() -> StoryRules.validateItem(none)).isInstanceOf(InvalidStoryException.class);
    }

    @Test
    void rejectsTextOnlyWithoutCaption() {
        StoryItem empty = new StoryItem(null, Story.Background.OCEAN, "  ", Story.CaptionPosition.CENTER, null, null, null, false);
        assertThatThrownBy(() -> StoryRules.validateItem(empty))
                .isInstanceOf(InvalidStoryException.class).hasMessageContaining("texto");
    }

    @Test
    void rejectsLinkAndShortTogether() {
        StoryItem both = new StoryItem(IMAGE, null, null, Story.CaptionPosition.BOTTOM, ContentType.PUBLICATION,
                UUID.randomUUID(), "https://youtube.com/shorts/abcdefghijk", false);
        assertThatThrownBy(() -> StoryRules.validateItem(both)).isInstanceOf(InvalidStoryException.class);
    }

    @Test
    void rejectsEpisodeAndStoryLinks() {
        for (ContentType type : List.of(ContentType.EPISODE, ContentType.STORY)) {
            StoryItem link = new StoryItem(IMAGE, null, null, Story.CaptionPosition.BOTTOM, type, UUID.randomUUID(), null, false);
            assertThatThrownBy(() -> StoryRules.validateItem(link)).isInstanceOf(InvalidStoryException.class);
        }
    }

    @Test
    void rejectsLinkTypeWithoutId() {
        StoryItem half = new StoryItem(IMAGE, null, null, Story.CaptionPosition.BOTTOM, ContentType.PLACE, null, null, false);
        assertThatThrownBy(() -> StoryRules.validateItem(half)).isInstanceOf(InvalidStoryException.class);
    }

    @Test
    void rejectsAShortThatIsNotYouTube() {
        StoryItem bad = new StoryItem(IMAGE, null, null, Story.CaptionPosition.BOTTOM, null, null, "https://vimeo.com/1", false);
        assertThatThrownBy(() -> StoryRules.validateItem(bad)).isInstanceOf(InvalidStoryException.class);
    }
}
