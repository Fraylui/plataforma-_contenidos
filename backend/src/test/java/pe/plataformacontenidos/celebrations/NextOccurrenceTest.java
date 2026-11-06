package pe.plataformacontenidos.celebrations;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.Test;

/** Celebraciones: cuándo «toca» la próxima vez una fecha que se repite cada año o una única. */
class NextOccurrenceTest {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");

    private static Instant lima(int year, int month, int day, int hour, int minute) {
        return ZonedDateTime.of(year, month, day, hour, minute, 0, 0, LIMA).toInstant();
    }

    @Test
    void aYearlyDateComesBackThisYearIfItHasNotPassed() {
        // 28 de julio de 1821, todo el día; hoy es 16 oct 2026 → 28 jul 2027
        Instant next = NextOccurrence.of(lima(1821, 7, 28, 0, 0), true, true, LIMA, LocalDate.of(2026, 10, 16));
        assertThat(next).isEqualTo(lima(2027, 7, 28, 0, 0));

        // Batalla de Ayacucho, 9 de diciembre → este mismo año
        assertThat(NextOccurrence.of(lima(1824, 12, 9, 0, 0), true, true, LIMA, LocalDate.of(2026, 10, 16)))
                .isEqualTo(lima(2026, 12, 9, 0, 0));
    }

    /**
     * Antes de 1908 Lima usaba la hora solar local (−5:08): leída con esa
     * regla, la medianoche (−5) del 9 de diciembre de 1824 cae el 8 a las
     * 11:51 p. m. y la Batalla de Ayacucho saldría un día antes. En una
     * fecha que se repite solo importan el día y la hora, no el año.
     */
    @Test
    void oldOriginYearsKeepTheirDayDespiteHistoricLocalMeanTime() {
        Instant ayacucho1824 = Instant.parse("1824-12-09T05:00:00Z");
        assertThat(NextOccurrence.of(ayacucho1824, true, true, LIMA, LocalDate.of(2026, 10, 16)))
                .isEqualTo(lima(2026, 12, 9, 0, 0));
        Instant independence1821 = Instant.parse("1821-07-28T05:00:00Z");
        assertThat(NextOccurrence.of(independence1821, true, true, LIMA, LocalDate.of(2026, 10, 16)))
                .isEqualTo(lima(2027, 7, 28, 0, 0));
        // Lo que manda el panel para 1821 (medianoche con la hora solar, 05:08 UTC) también.
        assertThat(NextOccurrence.of(Instant.parse("1821-07-28T05:08:00Z"), true, true, LIMA, LocalDate.of(2026, 10, 16)))
                .isEqualTo(lima(2027, 7, 28, 0, 0));
    }

    @Test
    void onTheDayItselfItIsStillTodayNotNextYear() {
        Instant next = NextOccurrence.of(lima(1821, 7, 28, 0, 0), true, true, LIMA, LocalDate.of(2026, 7, 28));
        assertThat(next).isEqualTo(lima(2026, 7, 28, 0, 0));
    }

    @Test
    void aYearlyDateWithTimeKeepsItsTime() {
        // Inti Raymi, 24 de junio a las 9:00
        assertThat(NextOccurrence.of(lima(2000, 6, 24, 9, 0), true, false, LIMA, LocalDate.of(2026, 3, 1)))
                .isEqualTo(lima(2026, 6, 24, 9, 0));
    }

    @Test
    void february29BecomesFebruary28InCommonYears() {
        assertThat(NextOccurrence.of(lima(2024, 2, 29, 0, 0), true, true, LIMA, LocalDate.of(2026, 1, 10)))
                .isEqualTo(lima(2026, 2, 28, 0, 0));
        assertThat(NextOccurrence.of(lima(2024, 2, 29, 0, 0), true, true, LIMA, LocalDate.of(2027, 12, 1)))
                .isEqualTo(lima(2028, 2, 29, 0, 0));
    }

    @Test
    void aOneTimeDateIsJustItsOwnDate() {
        Instant eclipse = lima(2026, 8, 12, 13, 30);
        assertThat(NextOccurrence.of(eclipse, false, false, LIMA, LocalDate.of(2030, 1, 1))).isEqualTo(eclipse);
    }

    @Test
    void startOfTodayIsMidnightInTheSiteZone() {
        assertThat(NextOccurrence.startOfDay(LocalDate.of(2026, 7, 28), LIMA)).isEqualTo(lima(2026, 7, 28, 0, 0));
    }
}
