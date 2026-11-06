package pe.plataformacontenidos.shared;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

/** Unit test puro: lo que escribe el panel contra lo que manda Cloudflare (anuncios y celebraciones). */
class RegionNamesTest {

    @ParameterizedTest(name = "\"{0}\" -> \"{1}\"")
    @CsvSource(delimiter = '|', value = {
            "Ayacucho|ayacucho",
            "Región de Ayacucho|ayacucho",
            "Ayacucho Region|ayacucho",
            "  departamento   de  Junín |junin",
            "Estado de México|mexico",
    })
    void normalizesWhatCloudflareAndThePanelWrite(String input, String expected) {
        assertEquals(expected, RegionNames.normalize(input));
    }

    @Test
    void matchesByNameOrByCode() {
        assertTrue(RegionNames.matches("Ayacucho", "Región de Ayacucho", null));
        assertTrue(RegionNames.matches("AYA", null, "AYA"));
        assertFalse(RegionNames.matches("Ayacucho", "Lima", "LIM"));
        assertFalse(RegionNames.matches("Ayacucho", null, null));
    }

    @ParameterizedTest
    @ValueSource(strings = {"XX", "T1", "Peru", ""})
    void unknownOrTorIsNoCountry(String header) {
        assertNull(RegionNames.visitorCountry(header));
    }

    @Test
    void visitorCountryIsUppercased() {
        assertEquals("PE", RegionNames.visitorCountry("pe"));
        assertNull(RegionNames.visitorCountry(null));
    }
}
