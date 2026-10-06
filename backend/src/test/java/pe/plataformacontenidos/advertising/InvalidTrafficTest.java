package pe.plataformacontenidos.advertising;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class InvalidTrafficTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36",
            "facebookexternalhit/1.1",
            "WhatsApp/2.23.20.0",
            "curl/8.4.0",
            "python-requests/2.31.0" })
    void automatedAgentsAreInvalid(String userAgent) {
        assertThat(InvalidTraffic.isAutomated(userAgent)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36" })
    void realBrowsersAreValid(String userAgent) {
        assertThat(InvalidTraffic.isAutomated(userAgent)).isFalse();
    }
}
