package pe.plataformacontenidos.feed;

import pe.plataformacontenidos.identity.permission.WorkerPermissionRepository;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.EntityManagerFactory;
import java.util.UUID;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import pe.plataformacontenidos.TestcontainersConfiguration;
import pe.plataformacontenidos.identity.permission.LegacyRole;
import pe.plataformacontenidos.identity.User;
import pe.plataformacontenidos.identity.UserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Feed unificado del home (Publicaciones + Lugares + Eventos) y contenido
 * relacionado de la vista de detalle — ver FeedService.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class FeedIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkerPermissionRepository workerPermissions;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Test
    void feedMixesArticlesPlacesAndEvents() throws Exception {
        String editorToken = createUserAndLogin("feed-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Mix");

        publishArticle(authorToken, editorToken, categoryId, "Feed: publicación de prueba " + UUID.randomUUID());
        publishPlace(authorToken, editorToken, categoryId, "Feed: lugar de prueba " + UUID.randomUUID());
        publishEvent(authorToken, editorToken, categoryId, "Feed: evento de prueba " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].type", hasItem("ARTICLE")))
                .andExpect(jsonPath("$.items[*].type", hasItem("PLACE")))
                .andExpect(jsonPath("$.items[*].type", hasItem("EVENT")));
    }

    /**
     * Hallado con la simulación de carga (k6, 2026-10-07): cada ítem del pool
     * cargaba sus fotos y videos con una consulta propia (N+1) y el backend se
     * saturaba en ~86 peticiones/s. Las colecciones se cargan por lotes: la
     * cantidad de consultas no crece con la cantidad de contenido.
     */
    @Test
    void feedQueryCountDoesNotGrowWithContent() throws Exception {
        String editorToken = createUserAndLogin("feed-n1-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-n1-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed N+1");
        for (int i = 0; i < 12; i++) {
            publishArticle(authorToken, editorToken, categoryId, "Feed N+1: publicación " + i + " " + UUID.randomUUID());
        }
        for (int i = 0; i < 6; i++) {
            publishPlace(authorToken, editorToken, categoryId, "Feed N+1: lugar " + i + " " + UUID.randomUUID());
        }

        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        mockMvc.perform(get("/api/v1/feed").param("size", "30")).andExpect(status().isOk());
        long queries = statistics.getPrepareStatementCount();
        statistics.setStatisticsEnabled(false);

        assertThat(queries).as("consultas de una página del feed").isLessThan(30);
    }

    /**
     * Simulación de carga (2026-10-07): sin N+1, el feed mixto seguía costando
     * ~54 ms porque reconstruía en cada petición el mismo conjunto de
     * candidatos para todos los visitantes. Mientras el contenido no cambia,
     * se reutiliza: solo se consulta la versión del contenido.
     */
    @Test
    void feedReusesCandidatesWhileContentUnchanged() throws Exception {
        mockMvc.perform(get("/api/v1/feed").param("size", "12").param("seed", "a")).andExpect(status().isOk());

        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        mockMvc.perform(get("/api/v1/feed").param("size", "12").param("seed", "b")).andExpect(status().isOk());
        long queries = statistics.getPrepareStatementCount();
        statistics.setStatisticsEnabled(false);

        assertThat(queries).as("consultas con candidatos reutilizados").isLessThanOrEqualTo(2);
    }

    @Test
    void feedShowsContentPublishedAfterCandidatesWereCached() throws Exception {
        String editorToken = createUserAndLogin("feed-cache-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-cache-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Cache");
        mockMvc.perform(get("/api/v1/feed").param("size", "100").param("type", "ARTICLE")).andExpect(status().isOk());

        String articleId = publishArticle(authorToken, editorToken, categoryId, "Feed: recién publicada " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "100").param("type", "ARTICLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", hasItem(articleId)));
    }

    @Test
    void feedExcludesIdsAlreadySeenByClient() throws Exception {
        String editorToken = createUserAndLogin("feed-exclude-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-exclude-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Exclude");

        String articleId = publishArticle(authorToken, editorToken, categoryId,
                "Feed: publicación a excluir " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("exclude", articleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", not(hasItem(articleId))));
    }

    @Test
    void feedKeepsMostRecentExcludeIdsWhenListExceedsTheBoundedLimit() throws Exception {
        // Regresión: boundedExcludeSet debe conservar los últimos IDs vistos
        // (los más recientes), no los primeros — el cliente reenvía la lista
        // completa de "ya visto" en orden de aparición en cada scroll.
        String editorToken = createUserAndLogin("feed-exclude-bound-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-exclude-bound-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Exclude Bound");

        String articleId = publishArticle(authorToken, editorToken, categoryId,
                "Feed: excluido al final de una lista larga " + UUID.randomUUID());

        String[] excludeParams = new String[301];
        for (int i = 0; i < 300; i++) {
            excludeParams[i] = UUID.randomUUID().toString();
        }
        excludeParams[300] = articleId; // el visto más recientemente, al final de la lista

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("exclude", excludeParams))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", not(hasItem(articleId))));
    }

    @Test
    void feedNeverReturnsUnpublishedContent() throws Exception {
        String authorToken = createUserAndLogin("feed-draft-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String editorToken = createUserAndLogin("feed-draft-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String categoryId = createCategory(editorToken, "Feed Draft");
        String draftTitle = "Feed: borrador que no debe salir " + UUID.randomUUID();

        mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(categoryId, draftTitle)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/feed").param("size", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].title", not(hasItem(draftTitle))));
    }

    @Test
    void malformedExcludeIdIsBadRequestNotServerError() throws Exception {
        mockMvc.perform(get("/api/v1/feed").param("exclude", "not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("Exception"))));
    }

    @Test
    void relatedReturnsItemsSharingCategoryAndExcludesSelf() throws Exception {
        String editorToken = createUserAndLogin("feed-related-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-related-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Related");
        String otherCategoryId = createCategory(editorToken, "Feed Related Otra");

        String sourceArticleId = publishArticle(authorToken, editorToken, categoryId,
                "Feed: fuente para relacionados " + UUID.randomUUID());
        String relatedPlaceId = publishPlace(authorToken, editorToken, categoryId,
                "Feed: lugar relacionado " + UUID.randomUUID());
        publishPlace(authorToken, editorToken, otherCategoryId, "Feed: lugar sin relación " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed/related")
                        .param("excludeType", "ARTICLE")
                        .param("excludeId", sourceArticleId)
                        .param("categoryId", categoryId)
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(sourceArticleId))))
                .andExpect(jsonPath("$[*].id", hasItem(relatedPlaceId)))
                .andExpect(jsonPath("$[*].categoryId", everyItem(is(categoryId))));
    }

    @Test
    void relatedWithoutCategoryReturnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/v1/feed/related")
                        .param("excludeType", "ARTICLE")
                        .param("excludeId", UUID.randomUUID().toString())
                        .param("categoryId", UUID.randomUUID().toString()))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void feedFiltersByContentTypeForTabs() throws Exception {
        String editorToken = createUserAndLogin("feed-tab-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-tab-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Tabs");

        publishArticle(authorToken, editorToken, categoryId, "Feed tab: publicación " + UUID.randomUUID());
        publishPlace(authorToken, editorToken, categoryId, "Feed tab: lugar " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("type", "PLACE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", not(hasSize(0))))
                .andExpect(jsonPath("$.items[*].type", everyItem(is("PLACE"))));
    }

    @Test
    void unknownTypeIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/feed").param("type", "NOPE"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void feedIncludesGalleriesAndBusinesses() throws Exception {
        String editorToken = createUserAndLogin("feed-five-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-five-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Cinco");

        publishGallery(authorToken, editorToken, categoryId, "Feed: galería " + UUID.randomUUID());
        String businessId = publishBusiness(authorToken, editorToken, categoryId, "Feed: negocio " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("type", "GALLERY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", not(hasSize(0))))
                .andExpect(jsonPath("$.items[*].type", everyItem(is("GALLERY"))));
        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("type", "BUSINESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.id == '" + businessId + "')].phone", hasItem("+51 966 123 456")))
                .andExpect(jsonPath("$.items[?(@.id == '" + businessId + "')].website", hasItem("https://hostal.example.com")));
    }

    @Test
    void feedFiltersByCategoryIncludingSubcategories() throws Exception {
        String editorToken = createUserAndLogin("feed-cat-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-cat-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String parentId = createCategory(editorToken, "Feed Padre");
        String childId = createSubcategory(editorToken, "Feed Hija", parentId);
        String otherId = createCategory(editorToken, "Feed Otro");

        String inChild = publishArticle(authorToken, editorToken, childId, "Feed hija " + UUID.randomUUID());
        String inOther = publishPlace(authorToken, editorToken, otherId, "Feed otro " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("categoryId", parentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", hasItem(inChild)))
                .andExpect(jsonPath("$.items[*].id", not(hasItem(inOther))));
    }

    @Test
    void itemCarriesImagesAndLocationForTheCard() throws Exception {
        String editorToken = createUserAndLogin("feed-img-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-img-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Imágenes");

        MvcResult created = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Mirador " + UUID.randomUUID() + "\",\"excerpt\":\"Resumen\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"latitude\":-13.16,\"longitude\":-74.22,"
                                + "\"images\":[" + externalImage("a") + "," + externalImage("b") + "," + externalImage("c") + "]}"))
                .andExpect(status().isCreated())
                .andReturn();
        String placeId = textField(created, "id");
        runWorkflow("/api/v1/admin/places/" + placeId, authorToken, editorToken);

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(placeId))
                .andExpect(jsonPath("$.items[0].images.length()").value(3))
                .andExpect(jsonPath("$.items[0].images[1].externalUrl").value("https://example.com/b.jpg"))
                .andExpect(jsonPath("$.items[0].latitude").value(-13.16))
                .andExpect(jsonPath("$.items[0].longitude").value(-74.22));
    }

    @Test
    void upcomingAgendaIsOrderedByStartDate() throws Exception {
        String editorToken = createUserAndLogin("feed-agenda-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-agenda-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Agenda");

        String later = publishEventAt(authorToken, editorToken, categoryId, "Agenda tarde " + UUID.randomUUID(),
                "2031-03-01T19:00:00Z");
        String sooner = publishEventAt(authorToken, editorToken, categoryId, "Agenda pronto " + UUID.randomUUID(),
                "2030-01-10T19:00:00Z");

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("type", "EVENT").param("sort", "upcoming")
                        .param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(sooner))
                .andExpect(jsonPath("$.items[1].id").value(later))
                .andExpect(jsonPath("$.items[0].startsAt").value("2030-01-10T19:00:00Z"));
    }

    @Test
    void topLikedListsMostLikedFirstAndSkipsContentWithoutLikes() throws Exception {
        String editorToken = createUserAndLogin("feed-top-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-top-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String categoryId = createCategory(editorToken, "Feed Top");

        String popularId = publishArticle(authorToken, editorToken, categoryId, "Feed top: popular " + UUID.randomUUID());
        String lessId = publishArticle(authorToken, editorToken, categoryId, "Feed top: menos " + UUID.randomUUID());
        String noneId = publishArticle(authorToken, editorToken, categoryId, "Feed top: sin likes " + UUID.randomUUID());
        likeArticle(popularId, 3);
        likeArticle(lessId, 1);

        MvcResult result = mockMvc.perform(get("/api/v1/feed/top").param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].likeCount", everyItem(org.hamcrest.Matchers.greaterThan(0))))
                .andReturn();
        java.util.List<String> ids = new java.util.ArrayList<>();
        objectMapper.readTree(result.getResponse().getContentAsString()).forEach(n -> ids.add(n.get("id").asString()));
        org.assertj.core.api.Assertions.assertThat(ids).contains(popularId, lessId).doesNotContain(noneId);
        org.assertj.core.api.Assertions.assertThat(ids.indexOf(popularId)).isLessThan(ids.indexOf(lessId));
    }

    private void likeArticle(String articleId, int times) throws Exception {
        JsonNode feed = objectMapper.readTree(mockMvc.perform(get("/api/v1/feed").param("size", "50").param("type", "ARTICLE"))
                .andReturn().getResponse().getContentAsString());
        String slug = null;
        for (JsonNode item : feed.get("items")) {
            if (item.get("id").asString().equals(articleId)) {
                slug = item.get("slug").asString();
            }
        }
        org.assertj.core.api.Assertions.assertThat(slug).as("slug de " + articleId).isNotNull();
        for (int i = 0; i < times; i++) {
            mockMvc.perform(post("/api/v1/articles/" + slug + "/like").param("visitorId", UUID.randomUUID().toString()))
                    .andExpect(status().isOk());
        }
    }

    private String publishArticle(String authorToken, String editorToken, String categoryId, String title)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(categoryId, title)))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/articles/" + id, authorToken, editorToken);
        return id;
    }

    private String publishPlace(String authorToken, String editorToken, String categoryId, String name)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/places/" + id, authorToken, editorToken);
        return id;
    }

    private String publishEvent(String authorToken, String editorToken, String categoryId, String title)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"2030-06-14T19:00:00Z\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/events/" + id, authorToken, editorToken);
        return id;
    }

    @Test
    void topicsListOnlyRootTopicsWithContentIncludingSubtopics() throws Exception {
        String editorToken = createUserAndLogin("feed-topics-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-topics-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String rootId = createCategory(editorToken, "Tema Raíz");
        String childId = createSubcategory(editorToken, "Tema Hijo", rootId);
        String emptyId = createCategory(editorToken, "Tema Vacío");
        publishArticle(authorToken, editorToken, childId, "Tema hijo " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed/topics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].categoryId", hasItem(rootId)))
                .andExpect(jsonPath("$[*].categoryId", not(hasItem(childId))))
                .andExpect(jsonPath("$[*].categoryId", not(hasItem(emptyId))));
    }

    @Test
    void topicIsMarkedNewOnlyWithin48Hours() throws Exception {
        String editorToken = createUserAndLogin("feed-new-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-new-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String freshId = createCategory(editorToken, "Tema Fresco");
        String oldId = createCategory(editorToken, "Tema Viejo");
        publishArticle(authorToken, editorToken, freshId, "Fresco " + UUID.randomUUID());
        String old = publishArticle(authorToken, editorToken, oldId, "Viejo " + UUID.randomUUID());
        jdbcTemplate.update("UPDATE content.articles SET published_at = now() - interval '3 days' WHERE id = ?::uuid", old);

        mockMvc.perform(get("/api/v1/feed/topics"))
                .andExpect(jsonPath("$[?(@.categoryId == '" + freshId + "')].hasNew", hasItem(true)))
                .andExpect(jsonPath("$[?(@.categoryId == '" + oldId + "')].hasNew", hasItem(false)));
    }

    @Test
    void topicCoverIsTheLatestContentThatHasAnImage() throws Exception {
        String editorToken = createUserAndLogin("feed-cover-editor@plataforma-contenidos.test", LegacyRole.EDITOR);
        String authorToken = createUserAndLogin("feed-cover-author@plataforma-contenidos.test", LegacyRole.AUTHOR);
        String topicId = createCategory(editorToken, "Tema Portada");
        String gallery = publishGallery(authorToken, editorToken, topicId, "Portada " + UUID.randomUUID());
        jdbcTemplate.update("UPDATE galleries.galleries SET published_at = now() - interval '1 day' WHERE id = ?::uuid", gallery);
        publishArticle(authorToken, editorToken, topicId, "Sin imagen " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed/topics"))
                .andExpect(jsonPath("$[?(@.categoryId == '" + topicId + "')].coverImageUrl",
                        hasItem("https://example.com/g.jpg")));
    }

    private String publishEventAt(String authorToken, String editorToken, String categoryId, String title,
            String startsAt) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/events")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"" + startsAt + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/events/" + id, authorToken, editorToken);
        return id;
    }

    private String publishGallery(String authorToken, String editorToken, String categoryId, String title)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/galleries")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen\","
                                + "\"categoryId\":\"" + categoryId + "\",\"images\":[" + externalImage("g") + "]}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/galleries/" + id, authorToken, editorToken);
        return id;
    }

    private String publishBusiness(String authorToken, String editorToken, String categoryId, String name)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/directory")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"excerpt\":\"Resumen\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"businessType\":\"HOTEL\","
                                + "\"phone\":\"+51 966 123 456\",\"website\":\"https://hostal.example.com\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/directory/" + id, authorToken, editorToken);
        return id;
    }

    private static String externalImage(String name) {
        return "{\"externalUrl\":\"https://example.com/" + name + ".jpg\",\"title\":\"Foto " + name + "\"}";
    }

    private String createSubcategory(String editorToken, String name, String parentId) throws Exception {
        name = name + " " + UUID.randomUUID().toString().substring(0, 8);
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"parentId\":\"" + parentId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private void runWorkflow(String basePath, String authorToken, String editorToken) throws Exception {
        mockMvc.perform(post(basePath + "/submit").header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post(basePath + "/approve").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
        mockMvc.perform(post(basePath + "/publish").header("Authorization", "Bearer " + editorToken))
                .andExpect(status().isOk());
    }

    private String articleJson(String categoryId, String title) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"excerpt\":\"Resumen breve\","
                + "\"body\":\"Cuerpo de prueba con suficiente contenido para publicar.\","
                + "\"articleType\":\"GENERAL\","
                + "\"categoryId\":\"" + categoryId + "\""
                + "}";
    }

    private String createCategory(String editorToken, String name) throws Exception {
        name = name + " " + UUID.randomUUID().toString().substring(0, 8);
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + editorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private String textField(MvcResult result, String field) throws Exception {
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get(field).asText();
    }

    private String createUserAndLogin(String email, LegacyRole role) throws Exception {
        String password = "SomeStrongPassword123!";
        User created = userRepository.save(new User(email, passwordEncoder.encode(password), "Test", "User", role.toRole()));
        role.grant(workerPermissions, created.getId());
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return textField(result, "accessToken");
    }
}
