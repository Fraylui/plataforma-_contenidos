package pe.plataformacontenidos.stories.api;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.engagement.ContentEngagementService;
import pe.plataformacontenidos.engagement.ContentEngagementService.Counts;
import pe.plataformacontenidos.stories.Story;
import pe.plataformacontenidos.stories.StoryService;
import pe.plataformacontenidos.stories.api.StoryDtos.ActiveTopic;
import pe.plataformacontenidos.stories.api.StoryDtos.AdminStory;
import pe.plataformacontenidos.stories.api.StoryDtos.LinkView;
import pe.plataformacontenidos.stories.api.StoryDtos.StoryView;
import pe.plataformacontenidos.stories.api.StoryDtos.TopicRef;
import pe.plataformacontenidos.taxonomy.Category;
import pe.plataformacontenidos.taxonomy.CategoryService;

/** Arma las respuestas de Historias: tema, botón del enlace y conteos, para el sitio y el panel. */
@Component
class StoryViews {

    private static final Map<ContentType, String> LINK_LABELS = Map.of(
            ContentType.PUBLICATION, "Ver publicación",
            ContentType.PLACE, "Ver lugar",
            ContentType.CELEBRATION, "Ver celebración",
            ContentType.GALLERY, "Ver galería");

    private final StoryService stories;
    private final CategoryService categories;
    private final ContentEngagementService engagement;

    StoryViews(StoryService stories, CategoryService categories, ContentEngagementService engagement) {
        this.stories = stories;
        this.categories = categories;
        this.engagement = engagement;
    }

    /** Agrupadas por tema activo; el tema con la historia más nueva primero. */
    List<ActiveTopic> activeTopics(List<Story> active) {
        Map<UUID, Category> topics = activeCategories();
        Map<UUID, Counts> counts = counts(active);
        Map<UUID, List<Story>> byTopic = active.stream().filter(story -> topics.containsKey(story.getCategoryId()))
                .collect(Collectors.groupingBy(Story::getCategoryId, LinkedHashMap::new, Collectors.toList()));
        return byTopic.entrySet().stream()
                .map(entry -> new ActiveTopic(topicRef(topics.get(entry.getKey())),
                        entry.getValue().stream().map(Story::getPublishedAt).max(Comparator.naturalOrder()).orElseThrow(),
                        entry.getValue().stream().map(story -> view(story, counts)).toList()))
                .sorted(Comparator.comparing(ActiveTopic::latestAt).reversed())
                .toList();
    }

    List<StoryView> views(List<Story> list) {
        Map<UUID, Counts> counts = counts(list);
        return list.stream().map(story -> view(story, counts)).toList();
    }

    StoryView view(Story story) {
        return view(story, counts(List.of(story)));
    }

    /** El tema de una historia, si sigue activo. */
    Optional<TopicRef> topicOf(Story story) {
        return Optional.ofNullable(activeCategories().get(story.getCategoryId())).map(StoryViews::topicRef);
    }

    List<AdminStory> admin(List<Story> list) {
        Map<UUID, Counts> counts = counts(list);
        Map<UUID, String> names = categories.listAll().stream().collect(Collectors.toMap(Category::getId, Category::getName));
        return list.stream().map(story -> {
            StoryView view = view(story, counts);
            return new AdminStory(view.id(), view.imageId(), view.background(), view.caption(), view.captionPosition(),
                    view.link(), view.youtubeVideoId(), view.publishedAt(), view.expiresAt(), view.highlighted(),
                    view.likeCount(), story.getCategoryId(), names.getOrDefault(story.getCategoryId(), ""),
                    counts.getOrDefault(story.getId(), new Counts(0, 0)).views(), story.getCtaClicks(),
                    story.getLinkContentType(), story.getLinkContentId());
        }).toList();
    }

    private StoryView view(Story story, Map<UUID, Counts> counts) {
        LinkView link = stories.linkOf(story)
                .map(ref -> new LinkView(ref.type(), ref.slug(), ref.title(), LINK_LABELS.get(ref.type())))
                .orElse(null);
        return new StoryView(story.getId(), story.getImageId(), story.getBackground(), story.getCaption(),
                story.getCaptionPosition(), link, story.getYoutubeVideoId(), story.getPublishedAt(), story.getExpiresAt(),
                story.isHighlighted(), counts.getOrDefault(story.getId(), new Counts(0, 0)).likes());
    }

    private Map<UUID, Counts> counts(List<Story> list) {
        return engagement.countsFor(ContentType.STORY, list.stream().map(Story::getId).toList());
    }

    private Map<UUID, Category> activeCategories() {
        return categories.listActive().stream().collect(Collectors.toMap(Category::getId, Function.identity()));
    }

    private static TopicRef topicRef(Category category) {
        return new TopicRef(category.getId(), category.getName(), category.getSlug());
    }
}
