package pe.plataformacontenidos.affiliates;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import pe.plataformacontenidos.affiliates.AffiliateLinkService.LinkInput;

/** Reglas de los enlaces de afiliado, sin base de datos. */
class AffiliateLinkRulesTest {

    @Test
    void onlyRealHttpsAddresses() {
        assertThat(AffiliateLinkService.isSafeHttpsUrl("https://www.civitatis.com/es/cusco/?aid=123")).isTrue();
        assertThat(AffiliateLinkService.isSafeHttpsUrl("http://tienda.pe/x")).as("sin https").isFalse();
        assertThat(AffiliateLinkService.isSafeHttpsUrl("javascript:alert(1)")).isFalse();
        assertThat(AffiliateLinkService.isSafeHttpsUrl("https://localhost/x")).as("sin dominio público").isFalse();
        assertThat(AffiliateLinkService.isSafeHttpsUrl("https://usuario:clave@tienda.pe")).as("con usuario").isFalse();
        assertThat(AffiliateLinkService.isSafeHttpsUrl("https://tienda.pe/a b")).as("con espacios").isFalse();
        assertThat(AffiliateLinkService.isSafeHttpsUrl("https://tienda.pe/" + "a".repeat(2048))).isFalse();
    }

    @Test
    void trimsAndRejectsBadNamesOrTooMany() {
        assertThat(AffiliateLinkService.validate(List.of(new LinkInput("  Tour a Machu Picchu ", " https://civitatis.com/x "))))
                .containsExactly(new LinkInput("Tour a Machu Picchu", "https://civitatis.com/x"));
        assertThat(AffiliateLinkService.validate(null)).isEmpty();
        assertThatThrownBy(() -> AffiliateLinkService.validate(List.of(new LinkInput(" ", "https://a.pe"))))
                .isInstanceOf(InvalidAffiliateLinkException.class);
        assertThatThrownBy(() -> AffiliateLinkService.validate(List.of(new LinkInput("x".repeat(81), "https://a.pe"))))
                .isInstanceOf(InvalidAffiliateLinkException.class);
        assertThatThrownBy(() -> AffiliateLinkService.validate(Collections.nCopies(11, new LinkInput("Tour", "https://a.pe"))))
                .isInstanceOf(InvalidAffiliateLinkException.class)
                .hasMessageContaining("10");
    }
}
