package pe.plataformacontenidos.stories;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import pe.plataformacontenidos.catalog.ContentLookup;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.content.Publication;
import pe.plataformacontenidos.content.PublicationInput;
import pe.plataformacontenidos.content.PublicationService;
import pe.plataformacontenidos.content.PublicationType;
import pe.plataformacontenidos.media.ImagePurpose;
import pe.plataformacontenidos.media.ImageService;
import pe.plataformacontenidos.shared.ContentImageInput;
import pe.plataformacontenidos.stories.StoryService.StoryItem;
import pe.plataformacontenidos.taxonomy.CategoryNotFoundException;
import pe.plataformacontenidos.taxonomy.CategoryService;

@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class StoryServiceIntegrationTest {

    private static final UUID AUTHOR = UUID.randomUUID();

    @Autowired
    private StoryService stories;
    @Autowired
    private CategoryService categories;
    @Autowired
    private ImageService images;
    @Autowired
    private PublicationService publications;
    @Autowired
    private ContentLookup contentLookup;
    @Autowired
    private JdbcTemplate jdbc;

    private UUID topic;

    @BeforeEach
    void topic() {
        topic = categories.create("Tema historias " + UUID.randomUUID(), null, null).getId();
    }

    @Test
    void createsABatchThatExpiresInTwentyFourHours() {
        List<Story> created = stories.createBatch(topic, List.of(photo(storyImage(), "Uno"), text("Dos")), AUTHOR);

        assertThat(created).hasSize(2);
        assertThat(created.getFirst().getExpiresAt()).isEqualTo(created.getFirst().getPublishedAt().plusSeconds(24 * 3600));
        assertThat(stories.listActive()).extracting(Story::getId).contains(created.get(0).getId(), created.get(1).getId());
    }

    @Test
    void listActiveExcludesExpiredButVisibleKeepsHighlighted() {
        Story expired = stories.createBatch(topic, List.of(text("Vieja")), AUTHOR).getFirst();
        Story kept = stories.createBatch(topic, List.of(text("Destacada")), AUTHOR).getFirst();
        stories.setHighlighted(kept.getId(), true, AUTHOR);
        jdbc.update("UPDATE stories.stories SET expires_at = now() - interval '1 hour' WHERE id IN (?, ?)",
                expired.getId(), kept.getId());

        assertThat(stories.listActive()).extracting(Story::getId).doesNotContain(expired.getId(), kept.getId());
        assertThat(stories.findVisible(expired.getId())).isEmpty();
        assertThat(stories.findVisible(kept.getId())).isPresent();
        assertThat(stories.listHighlights(topic)).extracting(Story::getId).containsExactly(kept.getId());
    }

    @Test
    void rejectsInactiveCategory() {
        categories.setActive(topic, false);
        assertThatThrownBy(() -> stories.createBatch(topic, List.of(text("Hola")), AUTHOR))
                .isInstanceOf(CategoryNotFoundException.class);
    }

    @Test
    void rejectsImageWithPurposeOtherThanStory() {
        UUID contentImage = upload(ImagePurpose.CONTENT);
        assertThatThrownBy(() -> stories.createBatch(topic, List.of(photo(contentImage, null)), AUTHOR))
                .isInstanceOf(InvalidStoryException.class).hasMessageContaining("Historias");
    }

    @Test
    void aBatchWithOneBadItemCreatesNothing() {
        long before = count();
        StoryItem badLink = new StoryItem(null, Story.Background.OCEAN, "x", Story.CaptionPosition.CENTER,
                ContentType.PUBLICATION, UUID.randomUUID(), null, false);
        assertThatThrownBy(() -> stories.createBatch(topic, List.of(text("Bien"), badLink), AUTHOR))
                .isInstanceOf(InvalidStoryException.class);
        assertThat(count()).isEqualTo(before);
    }

    @Test
    void linkToUnpublishedContentIsDropped() {
        Publication publication = publishedPublication();
        StoryItem linked = new StoryItem(null, Story.Background.FOREST, "Mira esto", Story.CaptionPosition.BOTTOM,
                ContentType.PUBLICATION, publication.getId(), null, false);
        Story story = stories.createBatch(topic, List.of(linked), AUTHOR).getFirst();
        assertThat(stories.linkOf(story)).hasValueSatisfying(ref -> assertThat(ref.slug()).isEqualTo(publication.getSlug()));

        publications.archive(publication.getId(), AUTHOR);

        assertThat(stories.linkOf(story)).isEmpty();
    }

    @Test
    void updateKeepsThePhotoAndChangesTheText() {
        UUID image = storyImage();
        Story story = stories.createBatch(topic, List.of(photo(image, "Antes")), AUTHOR).getFirst();

        Story updated = stories.update(story.getId(), new StoryItem(null, Story.Background.NIGHT, "Después",
                Story.CaptionPosition.TOP, null, null, "https://youtube.com/shorts/abcdefghijk", true), AUTHOR);

        assertThat(updated.getImageId()).isEqualTo(image);
        assertThat(updated.getBackground()).isNull();
        assertThat(updated.getCaption()).isEqualTo("Después");
        assertThat(updated.getYoutubeVideoId()).isEqualTo("abcdefghijk");
        assertThat(updated.isHighlighted()).isTrue();
    }

    @Test
    void contentLookupFindsOnlyPublishedAndItsSqlRunsForEveryLinkableType() {
        Publication publication = publishedPublication();
        assertThat(contentLookup.find(ContentType.PUBLICATION, publication.getId())).isPresent();

        Publication draft = publications.create(publicationInput("Borrador"), AUTHOR);
        assertThat(contentLookup.find(ContentType.PUBLICATION, draft.getId())).isEmpty();

        for (ContentType type : StoryRules.LINKABLE) {
            assertThat(contentLookup.find(type, UUID.randomUUID())).as("%s", type).isEmpty();
        }
    }

    // ---------- ayudas ----------

    private long count() {
        return jdbc.queryForObject("SELECT count(*) FROM stories.stories", Long.class);
    }

    private static StoryItem photo(UUID imageId, String caption) {
        return new StoryItem(imageId, null, caption, Story.CaptionPosition.BOTTOM, null, null, null, false);
    }

    private static StoryItem text(String caption) {
        return new StoryItem(null, Story.Background.SUNSET, caption, Story.CaptionPosition.CENTER, null, null, null, false);
    }

    private UUID storyImage() {
        return upload(ImagePurpose.STORY);
    }

    private UUID upload(ImagePurpose purpose) {
        return images.upload(png(), "historia.png", null, purpose, AUTHOR).getId();
    }

    private static byte[] png() {
        try {
            BufferedImage image = new BufferedImage(90, 160, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, "png", out);
            return out.toByteArray();
        } catch (java.io.IOException e) {
            throw new IllegalStateException(e);
        }
    }

    private Publication publishedPublication() {
        Publication publication = publications.create(publicationInput("Publicada " + UUID.randomUUID()), AUTHOR);
        return publications.publish(publication.getId(), AUTHOR);
    }

    private PublicationInput publicationInput(String title) {
        return new PublicationInput(title, "Resumen", "<p>Cuerpo</p>", PublicationType.GENERAL, topic, null, null, null,
                null, List.of(new ContentImageInput(null, "https://example.com/foto.jpg", "Foto", null)), List.of(), null);
    }
}
