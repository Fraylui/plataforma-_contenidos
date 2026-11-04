package pe.plataformacontenidos.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class MemorableDateTest {

    @Test
    void sinDiaNiMesNoHayFecha() {
        assertThat(MemorableDate.fromParts(null, null, null)).isNull();
    }

    @Test
    void diaYMesSinAnioEsValido() {
        MemorableDate date = MemorableDate.fromParts(null, 12, 9);
        assertThat(date.key()).isEqualTo(1209);
        assertThat(date.yearsAgo(LocalDate.of(2026, 12, 9))).isNull();
    }

    @Test
    void calculaLosAniosTranscurridos() {
        MemorableDate batalla = MemorableDate.fromParts(1824, 12, 9);
        assertThat(batalla.yearsAgo(LocalDate.of(2026, 12, 9))).isEqualTo(202);
    }

    @Test
    void rechazaFechasIncompletasOInexistentes() {
        assertThatThrownBy(() -> MemorableDate.fromParts(null, 12, null)).isInstanceOf(InvalidMemorableDateException.class);
        assertThatThrownBy(() -> MemorableDate.fromParts(null, null, 9)).isInstanceOf(InvalidMemorableDateException.class);
        assertThatThrownBy(() -> MemorableDate.fromParts(1824, null, null)).isInstanceOf(InvalidMemorableDateException.class);
        assertThatThrownBy(() -> MemorableDate.fromParts(null, 2, 30)).isInstanceOf(InvalidMemorableDateException.class);
        assertThatThrownBy(() -> MemorableDate.fromParts(null, 13, 1)).isInstanceOf(InvalidMemorableDateException.class);
        assertThatThrownBy(() -> MemorableDate.fromParts(0, 1, 1)).isInstanceOf(InvalidMemorableDateException.class);
    }

    @Test
    void elVeintinueveDeFebreroExigeAnioBisiesto() {
        assertThat(MemorableDate.fromParts(null, 2, 29).key()).isEqualTo(229);
        assertThat(MemorableDate.fromParts(2024, 2, 29).key()).isEqualTo(229);
        assertThatThrownBy(() -> MemorableDate.fromParts(2023, 2, 29)).isInstanceOf(InvalidMemorableDateException.class);
    }

    @Test
    void laVentanaCruzaElFinDeAnio() {
        List<MemorableDate.KeyOffset> keys = MemorableDate.upcomingKeys(LocalDate.of(2026, 12, 30), 4);
        assertThat(keys).extracting(MemorableDate.KeyOffset::key).containsExactly(1230, 1231, 101, 102);
        assertThat(keys).extracting(MemorableDate.KeyOffset::daysUntil).containsExactly(0, 1, 2, 3);
        assertThat(keys.get(2).occurrence()).isEqualTo(LocalDate.of(2027, 1, 1));
    }

    @Test
    void enAnioNoBisiestoEl28DeFebreroTraeLoDel29() {
        List<MemorableDate.KeyOffset> keys = MemorableDate.upcomingKeys(LocalDate.of(2027, 2, 28), 2);
        assertThat(keys).extracting(MemorableDate.KeyOffset::key).containsExactly(228, 229, 301);
        assertThat(keys.get(1).daysUntil()).isZero();

        List<MemorableDate.KeyOffset> leap = MemorableDate.upcomingKeys(LocalDate.of(2028, 2, 28), 2);
        assertThat(leap).extracting(MemorableDate.KeyOffset::key).containsExactly(228, 229);
        assertThat(leap.get(1).daysUntil()).isEqualTo(1);
    }
}
