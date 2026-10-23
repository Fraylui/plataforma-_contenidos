package pe.plataformacontenidos.advertising;

import java.util.Comparator;
import java.util.List;
import java.util.function.ToIntFunction;
import java.util.random.RandomGenerator;

/**
 * Orden aleatorio ponderado sin reemplazo (Efraimidis–Spirakis, 2006): cada
 * elemento recibe la clave {@code -ln(u) / peso} con {@code u} uniforme en
 * (0,1] y se ordena ascendente. La probabilidad de salir primero es
 * proporcional al peso, y el resto del orden respeta la misma proporción
 * entre los que quedan — es la rotación "ponderada" de los ad servers
 * (Google Ad Manager la llama "weighted"). Una campaña con peso 10 sale
 * primera el doble de veces que una con peso 5, pero la de peso 5 sigue
 * apareciendo: nunca se deja a un anunciante pagado sin vistas.
 */
final class WeightedOrder {

    private WeightedOrder() {
    }

    static <T> List<T> order(List<T> items, ToIntFunction<T> weight, RandomGenerator random) {
        record Keyed<T>(T item, double key) {
        }
        return items.stream()
                .map(item -> new Keyed<>(item, -Math.log(1.0 - random.nextDouble()) / Math.max(1, weight.applyAsInt(item))))
                .sorted(Comparator.comparingDouble(Keyed::key))
                .map(Keyed::item)
                .toList();
    }
}
