package pe.plataformacontenidos.advertising;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.SplittableRandom;
import org.junit.jupiter.api.Test;

class WeightedOrderTest {

    private record Item(String name, int weight) {
    }

    @Test
    void keepsEveryItemExactlyOnce() {
        var items = List.of(new Item("a", 1), new Item("b", 5), new Item("c", 10));
        var ordered = WeightedOrder.order(items, Item::weight, new SplittableRandom(1));
        assertThat(ordered).containsExactlyInAnyOrderElementsOf(items);
    }

    @Test
    void firstPlaceIsProportionalToWeight() {
        var heavy = new Item("heavy", 10);
        var light = new Item("light", 5);
        var random = new SplittableRandom(42);
        Map<String, Integer> firsts = new HashMap<>();
        int rounds = 30_000;
        for (int i = 0; i < rounds; i++) {
            firsts.merge(WeightedOrder.order(List.of(heavy, light), Item::weight, random).getFirst().name(), 1,
                    Integer::sum);
        }
        // Peso 10 contra 5: la pesada sale primera 2/3 de las veces, la liviana igual aparece 1/3.
        assertThat(firsts.get("heavy") / (double) rounds).isBetween(0.64, 0.69);
        assertThat(firsts.get("light") / (double) rounds).isBetween(0.31, 0.36);
    }

    @Test
    void equalWeightsRotateEvenly() {
        var items = List.of(new Item("a", 5), new Item("b", 5), new Item("c", 5));
        var random = new SplittableRandom(7);
        Map<String, Integer> firsts = new HashMap<>();
        for (int i = 0; i < 30_000; i++) {
            firsts.merge(WeightedOrder.order(items, Item::weight, random).getFirst().name(), 1, Integer::sum);
        }
        firsts.values().forEach(count -> assertThat(count / 30_000.0).isBetween(0.31, 0.36));
    }
}
