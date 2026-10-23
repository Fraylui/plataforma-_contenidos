package pe.plataformacontenidos.catalog;

import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import org.springframework.stereotype.Component;

/**
 * Todas las fichas de contenido que declaran los módulos (ver {@link ContentSource}).
 * Falla al arrancar si dos fichas reclaman el mismo tipo o la misma tabla.
 */
@Component
public class ContentRegistry {

    private final List<ContentSource> sources;
    private final Map<ContentType, ContentSource> byType = new EnumMap<>(ContentType.class);

    public ContentRegistry(List<ContentSource> sources) {
        this.sources = List.copyOf(sources);
        Set<String> tables = new HashSet<>();
        for (ContentSource source : this.sources) {
            if (!tables.add(source.table())) {
                throw new IllegalStateException("Dos fichas de contenido usan la tabla " + source.table());
            }
            if (source.type() != null && byType.put(source.type(), source) != null) {
                throw new IllegalStateException("Dos fichas de contenido declaran el tipo " + source.type());
            }
        }
    }

    public List<ContentSource> all() {
        return sources;
    }

    public List<ContentSource> where(Predicate<ContentSource> trait) {
        return sources.stream().filter(trait).toList();
    }

    /** La ficha de un tipo; si falta es un error de programación (cada módulo debe declarar la suya). */
    public ContentSource byType(ContentType type) {
        ContentSource source = byType.get(type);
        if (source == null) {
            throw new IllegalStateException("Ningún módulo declaró la ficha de contenido de " + type);
        }
        return source;
    }

    /** Fichas con tipo propio: las que tienen fila de lectura, visitas y me gusta. */
    public List<ContentSource> typed() {
        return where(source -> source.type() != null);
    }
}
