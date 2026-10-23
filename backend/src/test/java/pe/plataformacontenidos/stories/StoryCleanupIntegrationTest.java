package pe.plataformacontenidos.stories;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.media.ImagePurpose;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.stories.StoryService.StoryItem;
import pe.plataformacontenidos.taxonomy.CategoryService;

/** A los 7 días de terminar, una historia se borra con su foto; las Destacadas se quedan. */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class StoryCleanupIntegrationTest {

    private static final UUID AUTHOR = UUID.randomUUID();

    @Autowired private StoryService stories;
    @Autowired private StoryCleanupJob job;
    @Autowired private CategoryService categories;
    @Autowired private ImageService images;
    @Autowired private JdbcTemplate jdbc;

    private UUID topic;

    @BeforeEach
    void topic() {
        topic = categories.create("Limpieza " + UUID.randomUUID(), null, null).getId();
    }

    @Test
    void purgesNonHighlightedOlderThan7DaysAndTheirImages() {
        UUID image = upload();
        Story story = photoStory(image);
        endedDaysAgo(story, 8);

        job.purge();

        assertThat(exists("stories.stories", story.getId())).isFalse();
        assertThat(exists("media.images", image)).isFalse();
    }

    @Test
    void keepsHighlighted() {
        Story story = photoStory(upload());
        stories.setHighlighted(story.getId(), true, AUTHOR);
        endedDaysAgo(story, 30);

        job.purge();

        assertThat(exists("stories.stories", story.getId())).isTrue();
    }

    @Test
    void keepsEndedWithin7Days() {
        Story story = photoStory(upload());
        endedDaysAgo(story, 6);

        job.purge();

        assertThat(exists("stories.stories", story.getId())).isTrue();
    }

    @Test
    void imageUsedElsewhereIsKept() {
        UUID image = upload();
        Story old = photoStory(image);
        Story reused = photoStory(image);
        endedDaysAgo(old, 9);

        job.purge();

        // La historia vieja se borra; la foto no, porque otra historia todavía la usa (y el job no falla).
        assertThat(exists("stories.stories", old.getId())).isFalse();
        assertThat(exists("stories.stories", reused.getId())).isTrue();
        assertThat(exists("media.images", image)).isTrue();
    }

    private Story photoStory(UUID image) {
        return stories.createBatch(topic, List.of(new StoryItem(image, null, null, Story.CaptionPosition.BOTTOM, null,
                null, null, false)), AUTHOR).getFirst();
    }

    private void endedDaysAgo(Story story, int days) {
        jdbc.update("UPDATE stories.stories SET expires_at = now() - make_interval(days => ?) WHERE id = ?", days,
                story.getId());
    }

    private boolean exists(String table, UUID id) {
        return jdbc.queryForObject("SELECT count(*) FROM " + table + " WHERE id = ?", Long.class, id) > 0;
    }

    private UUID upload() {
        try {
            BufferedImage image = new BufferedImage(90, 160, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, "png", out);
            return images.upload(out.toByteArray(), "historia.png", null, ImagePurpose.STORY, AUTHOR).getId();
        } catch (java.io.IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
