package pe.plataformacontenidos.events;

import java.util.UUID;

public class EventNotFoundException extends RuntimeException {
    public EventNotFoundException(UUID id) {
        super("Evento no encontrado: " + id);
    }

    public EventNotFoundException(String slug) {
        super("Evento no encontrado: " + slug);
    }
}
