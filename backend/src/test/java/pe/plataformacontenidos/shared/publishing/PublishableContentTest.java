package pe.plataformacontenidos.shared.publishing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import org.junit.jupiter.api.Test;

/** Máquina de estados compartida por los 5 tipos de contenido (spec 2026-10-07 §1). */
class PublishableContentTest {

    private static final Instant NOW = Instant.parse("2026-10-07T15:00:00Z");

    private static final class Content extends PublishableContent {
    }

    private static Content inStatus(PublicationStatus status) {
        Content content = new Content();
        switch (status) {
            case DRAFT -> { }
            case IN_REVIEW -> content.submitForApproval();
            case SCHEDULED -> content.schedule(NOW.plusSeconds(3600), NOW);
            case PUBLISHED -> content.publishNow(NOW);
            case ARCHIVED -> {
                content.publishNow(NOW);
                content.archive();
            }
        }
        return content;
    }

    @Test
    void newContentIsDraft() {
        assertThat(new Content().getStatus()).isEqualTo(PublicationStatus.DRAFT);
    }

    @Test
    void submitOnlyFromDraftAndClearsTheNote() {
        Content content = inStatus(PublicationStatus.IN_REVIEW);
        content.returnToDraft("Falta la foto de portada");
        assertThat(content.getReviewNote()).isEqualTo("Falta la foto de portada");

        content.submitForApproval();
        assertThat(content.getStatus()).isEqualTo(PublicationStatus.IN_REVIEW);
        assertThat(content.getReviewNote()).isNull();

        for (PublicationStatus from : new PublicationStatus[] {PublicationStatus.IN_REVIEW, PublicationStatus.SCHEDULED,
                PublicationStatus.PUBLISHED, PublicationStatus.ARCHIVED}) {
            assertThatThrownBy(() -> inStatus(from).submitForApproval())
                    .isInstanceOf(InvalidPublicationTransitionException.class);
        }
    }

    @Test
    void publishFromDraftReviewOrScheduled() {
        for (PublicationStatus from : new PublicationStatus[] {PublicationStatus.DRAFT, PublicationStatus.IN_REVIEW,
                PublicationStatus.SCHEDULED}) {
            Content content = inStatus(from);
            content.publishNow(NOW);
            assertThat(content.getStatus()).isEqualTo(PublicationStatus.PUBLISHED);
            assertThat(content.getPublishedAt()).isEqualTo(NOW);
            assertThat(content.getScheduledAt()).isNull();
        }
        assertThatThrownBy(() -> inStatus(PublicationStatus.PUBLISHED).publishNow(NOW))
                .isInstanceOf(InvalidPublicationTransitionException.class);
        assertThatThrownBy(() -> inStatus(PublicationStatus.ARCHIVED).publishNow(NOW))
                .isInstanceOf(InvalidPublicationTransitionException.class);
    }

    @Test
    void scheduleNeedsAFutureDate() {
        Content content = inStatus(PublicationStatus.DRAFT);
        assertThatThrownBy(() -> content.schedule(NOW.minusSeconds(1), NOW)).isInstanceOf(InvalidScheduleException.class);

        content.schedule(NOW.plusSeconds(60), NOW);
        assertThat(content.getStatus()).isEqualTo(PublicationStatus.SCHEDULED);
        assertThat(content.getScheduledAt()).isEqualTo(NOW.plusSeconds(60));

        content.schedule(NOW.plusSeconds(120), NOW);
        assertThat(content.getScheduledAt()).isEqualTo(NOW.plusSeconds(120));

        assertThatThrownBy(() -> inStatus(PublicationStatus.PUBLISHED).schedule(NOW.plusSeconds(60), NOW))
                .isInstanceOf(InvalidPublicationTransitionException.class);
    }

    @Test
    void returnToDraftFromReviewOrScheduledKeepsTheNote() {
        Content reviewed = inStatus(PublicationStatus.IN_REVIEW);
        reviewed.returnToDraft("  Revisa el título  ");
        assertThat(reviewed.getStatus()).isEqualTo(PublicationStatus.DRAFT);
        assertThat(reviewed.getReviewNote()).isEqualTo("Revisa el título");

        Content scheduled = inStatus(PublicationStatus.SCHEDULED);
        scheduled.returnToDraft(" ");
        assertThat(scheduled.getStatus()).isEqualTo(PublicationStatus.DRAFT);
        assertThat(scheduled.getScheduledAt()).isNull();
        assertThat(scheduled.getReviewNote()).isNull();

        assertThatThrownBy(() -> inStatus(PublicationStatus.DRAFT).returnToDraft(null))
                .isInstanceOf(InvalidPublicationTransitionException.class);
        assertThatThrownBy(() -> inStatus(PublicationStatus.PUBLISHED).returnToDraft(null))
                .isInstanceOf(InvalidPublicationTransitionException.class);
    }

    @Test
    void archiveOnlyPublished() {
        Content content = inStatus(PublicationStatus.PUBLISHED);
        content.archive();
        assertThat(content.getStatus()).isEqualTo(PublicationStatus.ARCHIVED);
        assertThatThrownBy(() -> inStatus(PublicationStatus.DRAFT).archive())
                .isInstanceOf(InvalidPublicationTransitionException.class);
    }

    @Test
    void scheduleFiresOnlyForScheduledContent() {
        Content content = inStatus(PublicationStatus.SCHEDULED);
        content.publishFromSchedule(NOW.plusSeconds(3601));
        assertThat(content.getStatus()).isEqualTo(PublicationStatus.PUBLISHED);
        assertThat(content.getPublishedAt()).isEqualTo(NOW.plusSeconds(3601));
        assertThatThrownBy(() -> inStatus(PublicationStatus.DRAFT).publishFromSchedule(NOW))
                .isInstanceOf(InvalidPublicationTransitionException.class);
    }

    @Test
    void whoCanEditWhat() {
        assertThat(inStatus(PublicationStatus.DRAFT).isEditableByCreator()).isTrue();
        assertThat(inStatus(PublicationStatus.IN_REVIEW).isEditableByCreator()).isFalse();
        assertThat(inStatus(PublicationStatus.PUBLISHED).isEditableByCreator()).isFalse();
        for (PublicationStatus status : PublicationStatus.values()) {
            assertThat(inStatus(status).isEditableByPublisher()).isEqualTo(status != PublicationStatus.ARCHIVED);
        }
    }

    @Test
    void everyTransitionTouchesUpdatedAt() {
        Content content = new Content();
        Instant before = content.getUpdatedAt();
        content.submitForApproval();
        assertThat(content.getUpdatedAt()).isAfterOrEqualTo(before);
    }

    @Test
    void transitionErrorSpeaksPlainSpanish() {
        assertThatThrownBy(() -> inStatus(PublicationStatus.ARCHIVED).publishNow(NOW))
                .hasMessage("No se puede publicar: está Archivado.");
    }
}
