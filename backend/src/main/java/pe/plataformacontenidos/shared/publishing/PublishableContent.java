package pe.plataformacontenidos.shared.publishing;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.MappedSuperclass;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

/**
 * Estado de publicación y sus reglas, una sola vez para los 5 tipos de
 * contenido (antes había 5 enums y 5 copias de cada transición). Superclase
 * mapeada y no @Embeddable a propósito: los campos siguen llamándose
 * {@code status}, {@code publishedAt}, {@code scheduledAt}, así que las
 * consultas de los repositorios no cambian.
 */
@MappedSuperclass
public abstract class PublishableContent {

    private static final Set<PublicationStatus> PUBLISHABLE =
            EnumSet.of(PublicationStatus.DRAFT, PublicationStatus.IN_REVIEW, PublicationStatus.SCHEDULED);

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PublicationStatus status = PublicationStatus.DRAFT;

    /** Nota de quien devolvió el contenido a borrador; se borra al volver a enviarlo. */
    @Column(name = "review_note")
    private String reviewNote;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public PublicationStatus getStatus() {
        return status;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /** Quien solo crea edita lo suyo mientras es borrador. */
    public boolean isEditableByCreator() {
        return status == PublicationStatus.DRAFT;
    }

    /** Quien publica edita todo menos lo archivado. */
    public boolean isEditableByPublisher() {
        return status != PublicationStatus.ARCHIVED;
    }

    public void submitForApproval() {
        require(status == PublicationStatus.DRAFT, "enviar para aprobar");
        status = PublicationStatus.IN_REVIEW;
        reviewNote = null;
        touch();
    }

    public void publishNow(Instant now) {
        require(PUBLISHABLE.contains(status), "publicar");
        status = PublicationStatus.PUBLISHED;
        publishedAt = now;
        scheduledAt = null;
        touch();
    }

    public void schedule(Instant when, Instant now) {
        require(PUBLISHABLE.contains(status), "programar");
        if (!when.isAfter(now)) {
            throw new InvalidScheduleException("La fecha de publicación programada debe ser futura");
        }
        status = PublicationStatus.SCHEDULED;
        scheduledAt = when;
        touch();
    }

    /** Devolver a borrador (desde pendiente o programado), con una nota opcional para quien lo creó. */
    public void returnToDraft(String note) {
        require(status == PublicationStatus.IN_REVIEW || status == PublicationStatus.SCHEDULED, "devolver a borrador");
        status = PublicationStatus.DRAFT;
        scheduledAt = null;
        reviewNote = note == null || note.isBlank() ? null : note.strip();
        touch();
    }

    public void archive() {
        require(status == PublicationStatus.PUBLISHED, "archivar");
        status = PublicationStatus.ARCHIVED;
        touch();
    }

    /** Lo usa la tarea de publicación programada cuando la fecha ya pasó. */
    public void publishFromSchedule(Instant now) {
        require(status == PublicationStatus.SCHEDULED, "publicar lo programado");
        status = PublicationStatus.PUBLISHED;
        publishedAt = now;
        touch();
    }

    /** Las subclases lo llaman al cambiar su contenido (la versión del feed depende de updated_at). */
    protected void touch() {
        updatedAt = Instant.now();
    }

    private void require(boolean allowed, String action) {
        if (!allowed) {
            throw new InvalidPublicationTransitionException(status, action);
        }
    }
}
