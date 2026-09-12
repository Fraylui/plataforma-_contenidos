package pe.plataformacontenidos.shared;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

/** Unit test puro (sin Spring): Slugify es la base de todas las URLs públicas, un cambio acá rompe enlaces indexados. */
class SlugifyTest {

    @ParameterizedTest(name = "\"{0}\" -> \"{1}\"")
    @CsvSource(delimiter = '|', value = {
            "Hola Mundo|hola-mundo",
            "Gastronomía de Ayacucho|gastronomia-de-ayacucho",
            "  espacios   al  borde  |espacios-al-borde",
            "Ñandú & Cóndor: ¿vuelan?|nandu-condor-vuelan",
            "Tokyo 東京 2026|tokyo-2026",
            "----ya---con---guiones----|ya-con-guiones",
            "UPPER CASE|upper-case",
            "café.au.lait|cafe-au-lait",
    })
    void generatesUrlSafeLowercaseSlugs(String input, String expected) {
        assertEquals(expected, Slugify.slugify(input));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "東京", "!!!"})
    void inputsWithoutAsciiLettersProduceEmptySlug(String input) {
        // El servicio que llama debe tratar el slug vacío (fallback a id/fecha); acá solo se fija el contrato.
        assertEquals("", Slugify.slugify(input));
    }
}
