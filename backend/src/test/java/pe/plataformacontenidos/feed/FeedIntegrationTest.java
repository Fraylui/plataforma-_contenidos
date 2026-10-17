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
import pe.plataformacontenidos.identity.permission.TestProfile;
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
    void feedMixesPublicationsPlacesAndCelebrations() throws Exception {
        String publisherToken = createUserAndLogin("feed-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Mix");

        publishPublication(creatorToken, publisherToken, categoryId, "Feed: publicación de prueba " + UUID.randomUUID());
        publishPlace(creatorToken, publisherToken, categoryId, "Feed: lugar de prueba " + UUID.randomUUID());
        publishCelebration(creatorToken, publisherToken, categoryId, "Feed: evento de prueba " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].type", hasItem("PUBLICATION")))
                .andExpect(jsonPath("$.items[*].type", hasItem("PLACE")))
                .andExpect(jsonPath("$.items[*].type", hasItem("CELEBRATION")));
    }

    /**
     * Hallado con la simulación de carga (k6, 2026-10-07): cada ítem del pool
     * cargaba sus fotos y videos con una consulta propia (N+1) y el backend se
     * saturaba en ~86 peticiones/s. Las colecciones se cargan por lotes: la
     * cantidad de consultas no crece con la cantidad de contenido.
     */
    @Test
    void feedQueryCountDoesNotGrowWithContent() throws Exception {
        String publisherToken = createUserAndLogin("feed-n1-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-n1-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed N+1");
        for (int i = 0; i < 12; i++) {
            publishPublication(creatorToken, publisherToken, categoryId, "Feed N+1: publicación " + i + " " + UUID.randomUUID());
        }
        for (int i = 0; i < 6; i++) {
            publishPlace(creatorToken, publisherToken, categoryId, "Feed N+1: lugar " + i + " " + UUID.randomUUID());
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
        String publisherToken = createUserAndLogin("feed-cache-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-cache-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Cache");
        mockMvc.perform(get("/api/v1/feed").param("size", "100").param("type", "PUBLICATION")).andExpect(status().isOk());

        String publicationId = publishPublication(creatorToken, publisherToken, categoryId, "Feed: recién publicada " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "100").param("type", "PUBLICATION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", hasItem(publicationId)));
    }

    @Test
    void feedExcludesIdsAlreadySeenByClient() throws Exception {
        String publisherToken = createUserAndLogin("feed-exclude-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-exclude-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Exclude");

        String publicationId = publishPublication(creatorToken, publisherToken, categoryId,
                "Feed: publicación a excluir " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("exclude", publicationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", not(hasItem(publicationId))));
    }

    @Test
    void feedKeepsMostRecentExcludeIdsWhenListExceedsTheBoundedLimit() throws Exception {
        // Regresión: boundedExcludeSet debe conservar los últimos IDs vistos
        // (los más recientes), no los primeros — el cliente reenvía la lista
        // completa de "ya visto" en orden de aparición en cada scroll.
        String publisherToken = createUserAndLogin("feed-exclude-bound-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-exclude-bound-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Exclude Bound");

        String publicationId = publishPublication(creatorToken, publisherToken, categoryId,
                "Feed: excluido al final de una lista larga " + UUID.randomUUID());

        String[] excludeParams = new String[301];
        for (int i = 0; i < 300; i++) {
            excludeParams[i] = UUID.randomUUID().toString();
        }
        excludeParams[300] = publicationId; // el visto más recientemente, al final de la lista

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("exclude", excludeParams))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", not(hasItem(publicationId))));
    }

    @Test
    void feedNeverReturnsUnpublishedContent() throws Exception {
        String creatorToken = createUserAndLogin("feed-draft-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String publisherToken = createUserAndLogin("feed-draft-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String categoryId = createCategory(publisherToken, "Feed Draft");
        String draftTitle = "Feed: borrador que no debe salir " + UUID.randomUUID();

        mockMvc.perform(post("/api/v1/admin/publications")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(publicationJson(categoryId, draftTitle)))
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
        String publisherToken = createUserAndLogin("feed-related-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-related-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Related");
        String otherCategoryId = createCategory(publisherToken, "Feed Related Otra");

        String sourcePublicationId = publishPublication(creatorToken, publisherToken, categoryId,
                "Feed: fuente para relacionados " + UUID.randomUUID());
        String relatedPlaceId = publishPlace(creatorToken, publisherToken, categoryId,
                "Feed: lugar relacionado " + UUID.randomUUID());
        publishPlace(creatorToken, publisherToken, otherCategoryId, "Feed: lugar sin relación " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed/related")
                        .param("excludeType", "PUBLICATION")
                        .param("excludeId", sourcePublicationId)
                        .param("categoryId", categoryId)
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(sourcePublicationId))))
                .andExpect(jsonPath("$[*].id", hasItem(relatedPlaceId)))
                .andExpect(jsonPath("$[*].categoryId", everyItem(is(categoryId))));
    }

    @Test
    void relatedWithoutCategoryReturnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/v1/feed/related")
                        .param("excludeType", "PUBLICATION")
                        .param("excludeId", UUID.randomUUID().toString())
                        .param("categoryId", UUID.randomUUID().toString()))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void feedFiltersByContentTypeForTabs() throws Exception {
        String publisherToken = createUserAndLogin("feed-tab-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-tab-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Tabs");

        publishPublication(creatorToken, publisherToken, categoryId, "Feed tab: publicación " + UUID.randomUUID());
        publishPlace(creatorToken, publisherToken, categoryId, "Feed tab: lugar " + UUID.randomUUID());

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
    void feedIncludesGalleries() throws Exception {
        String publisherToken = createUserAndLogin("feed-five-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-five-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Cinco");

        publishGallery(creatorToken, publisherToken, categoryId, "Feed: galería " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("type", "GALLERY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", not(hasSize(0))))
                .andExpect(jsonPath("$.items[*].type", everyItem(is("GALLERY"))));
        // El Directorio se quitó (V71): ya no es un tipo del feed.
        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("type", "BUSINESS"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void feedFiltersByCategoryIncludingSubcategories() throws Exception {
        String publisherToken = createUserAndLogin("feed-cat-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-cat-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String parentId = createCategory(publisherToken, "Feed Padre");
        String childId = createSubcategory(publisherToken, "Feed Hija", parentId);
        String otherId = createCategory(publisherToken, "Feed Otro");

        String inChild = publishPublication(creatorToken, publisherToken, childId, "Feed hija " + UUID.randomUUID());
        String inOther = publishPlace(creatorToken, publisherToken, otherId, "Feed otro " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("categoryId", parentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", hasItem(inChild)))
                .andExpect(jsonPath("$.items[*].id", not(hasItem(inOther))));
    }

    @Test
    void itemCarriesImagesAndLocationForTheCard() throws Exception {
        String publisherToken = createUserAndLogin("feed-img-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-img-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Imágenes");

        MvcResult created = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Mirador " + UUID.randomUUID() + "\",\"excerpt\":\"Resumen\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"latitude\":-13.16,\"longitude\":-74.22,"
                                + "\"images\":[" + externalImage("a") + "," + externalImage("b") + "," + externalImage("c") + "]}"))
                .andExpect(status().isCreated())
                .andReturn();
        String placeId = textField(created, "id");
        runWorkflow("/api/v1/admin/places/" + placeId, creatorToken, publisherToken);

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
        String publisherToken = createUserAndLogin("feed-agenda-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-agenda-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Agenda");

        String later = publishCelebrationAt(creatorToken, publisherToken, categoryId, "Agenda tarde " + UUID.randomUUID(),
                "2031-03-01T19:00:00Z");
        String sooner = publishCelebrationAt(creatorToken, publisherToken, categoryId, "Agenda pronto " + UUID.randomUUID(),
                "2030-01-10T19:00:00Z");

        mockMvc.perform(get("/api/v1/feed").param("size", "30").param("type", "CELEBRATION").param("sort", "upcoming")
                        .param("categoryId", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(sooner))
                .andExpect(jsonPath("$.items[1].id").value(later))
                .andExpect(jsonPath("$.items[0].startsAt").value("2030-01-10T19:00:00Z"));
    }

    @Test
    void topLikedListsMostLikedFirstAndSkipsContentWithoutLikes() throws Exception {
        String publisherToken = createUserAndLogin("feed-top-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-top-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String categoryId = createCategory(publisherToken, "Feed Top");

        String popularId = publishPublication(creatorToken, publisherToken, categoryId, "Feed top: popular " + UUID.randomUUID());
        String lessId = publishPublication(creatorToken, publisherToken, categoryId, "Feed top: menos " + UUID.randomUUID());
        String noneId = publishPublication(creatorToken, publisherToken, categoryId, "Feed top: sin likes " + UUID.randomUUID());
        likePublication(popularId, 3);
        likePublication(lessId, 1);

        MvcResult result = mockMvc.perform(get("/api/v1/feed/top").param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].likeCount", everyItem(org.hamcrest.Matchers.greaterThan(0))))
                .andReturn();
        java.util.List<String> ids = new java.util.ArrayList<>();
        objectMapper.readTree(result.getResponse().getContentAsString()).forEach(n -> ids.add(n.get("id").asString()));
        org.assertj.core.api.Assertions.assertThat(ids).contains(popularId, lessId).doesNotContain(noneId);
        org.assertj.core.api.Assertions.assertThat(ids.indexOf(popularId)).isLessThan(ids.indexOf(lessId));
    }

    private void likePublication(String publicationId, int times) throws Exception {
        JsonNode feed = objectMapper.readTree(mockMvc.perform(get("/api/v1/feed").param("size", "50").param("type", "PUBLICATION"))
                .andReturn().getResponse().getContentAsString());
        String slug = null;
        for (JsonNode item : feed.get("items")) {
            if (item.get("id").asString().equals(publicationId)) {
                slug = item.get("slug").asString();
            }
        }
        org.assertj.core.api.Assertions.assertThat(slug).as("slug de " + publicationId).isNotNull();
        for (int i = 0; i < times; i++) {
            mockMvc.perform(post("/api/v1/publications/" + slug + "/like").param("visitorId", UUID.randomUUID().toString()))
                    .andExpect(status().isOk());
        }
    }

    private String publishPublication(String creatorToken, String publisherToken, String categoryId, String title)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/publications")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(publicationJson(categoryId, title)))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/publications/" + id, creatorToken, publisherToken);
        return id;
    }

    private String publishPlace(String creatorToken, String publisherToken, String categoryId, String name)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/places")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/places/" + id, creatorToken, publisherToken);
        return id;
    }

    private String publishCelebration(String creatorToken, String publisherToken, String categoryId, String title)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/celebrations")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"2030-06-14T19:00:00Z\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/celebrations/" + id, creatorToken, publisherToken);
        return id;
    }

    @Test
    void topicsListOnlyRootTopicsWithContentIncludingSubtopics() throws Exception {
        String publisherToken = createUserAndLogin("feed-topics-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-topics-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String rootId = createCategory(publisherToken, "Tema Raíz");
        String childId = createSubcategory(publisherToken, "Tema Hijo", rootId);
        String emptyId = createCategory(publisherToken, "Tema Vacío");
        publishPublication(creatorToken, publisherToken, childId, "Tema hijo " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed/topics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].categoryId", hasItem(rootId)))
                .andExpect(jsonPath("$[*].categoryId", not(hasItem(childId))))
                .andExpect(jsonPath("$[*].categoryId", not(hasItem(emptyId))));
    }

    @Test
    void topicIsMarkedNewOnlyWithin48Hours() throws Exception {
        String publisherToken = createUserAndLogin("feed-new-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-new-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String freshId = createCategory(publisherToken, "Tema Fresco");
        String oldId = createCategory(publisherToken, "Tema Viejo");
        publishPublication(creatorToken, publisherToken, freshId, "Fresco " + UUID.randomUUID());
        String old = publishPublication(creatorToken, publisherToken, oldId, "Viejo " + UUID.randomUUID());
        jdbcTemplate.update("UPDATE content.publications SET published_at = now() - interval '3 days' WHERE id = ?::uuid", old);

        mockMvc.perform(get("/api/v1/feed/topics"))
                .andExpect(jsonPath("$[?(@.categoryId == '" + freshId + "')].hasNew", hasItem(true)))
                .andExpect(jsonPath("$[?(@.categoryId == '" + oldId + "')].hasNew", hasItem(false)));
    }

    @Test
    void topicCoverIsTheLatestContentThatHasAnImage() throws Exception {
        String publisherToken = createUserAndLogin("feed-cover-publicador@plataforma-contenidos.test", TestProfile.PUBLICADOR);
        String creatorToken = createUserAndLogin("feed-cover-creador@plataforma-contenidos.test", TestProfile.SOLO_CONTENIDO);
        String topicId = createCategory(publisherToken, "Tema Portada");
        String gallery = publishGallery(creatorToken, publisherToken, topicId, "Portada " + UUID.randomUUID());
        jdbcTemplate.update("UPDATE galleries.galleries SET published_at = now() - interval '1 day' WHERE id = ?::uuid", gallery);
        publishPublication(creatorToken, publisherToken, topicId, "Sin imagen " + UUID.randomUUID());

        mockMvc.perform(get("/api/v1/feed/topics"))
                .andExpect(jsonPath("$[?(@.categoryId == '" + topicId + "')].coverImageUrl",
                        hasItem("https://example.com/g.jpg")));
    }

    private String publishCelebrationAt(String creatorToken, String publisherToken, String categoryId, String title,
            String startsAt) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/celebrations")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen breve\","
                                + "\"body\":\"Cuerpo de prueba con suficiente contenido.\","
                                + "\"categoryId\":\"" + categoryId + "\",\"startsAt\":\"" + startsAt + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/celebrations/" + id, creatorToken, publisherToken);
        return id;
    }

    private String publishGallery(String creatorToken, String publisherToken, String categoryId, String title)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/galleries")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"excerpt\":\"Resumen\","
                                + "\"categoryId\":\"" + categoryId + "\",\"images\":[" + externalImage("g") + "]}"))
                .andExpect(status().isCreated())
                .andReturn();
        String id = textField(result, "id");
        runWorkflow("/api/v1/admin/galleries/" + id, creatorToken, publisherToken);
        return id;
    }


    private static String externalImage(String name) {
        return "{\"externalUrl\":\"https://example.com/" + name + ".jpg\",\"title\":\"Foto " + name + "\"}";
    }

    private String createSubcategory(String publisherToken, String name, String parentId) throws Exception {
        name = name + " " + UUID.randomUUID().toString().substring(0, 8);
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"parentId\":\"" + parentId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return textField(result, "id");
    }

    private void runWorkflow(String basePath, String creatorToken, String publisherToken) throws Exception {
        mockMvc.perform(post(basePath + "/publish").header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk());
    }

    private String publicationJson(String categoryId, String title) {
        return "{"
                + "\"title\":\"" + title + "\","
                + "\"excerpt\":\"Resumen breve\","
                + "\"body\":\"Cuerpo de prueba con suficiente contenido para publicar.\","
                + "\"publicationType\":\"GENERAL\","
                + "\"categoryId\":\"" + categoryId + "\""
                + "}";
    }

    private String createCategory(String publisherToken, String name) throws Exception {
        name = name + " " + UUID.randomUUID().toString().substring(0, 8);
        MvcResult result = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + publisherToken)
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

    private String createUserAndLogin(String email, TestProfile role) throws Exception {
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
