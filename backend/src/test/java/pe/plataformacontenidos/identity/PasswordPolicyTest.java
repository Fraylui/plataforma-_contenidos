package pe.plataformacontenidos.identity;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class PasswordPolicyTest {

    @Test
    void requiresTwelveCharactersAndADifferentPassword() {
        assertThatThrownBy(() -> PasswordPolicy.validate("ClaveActual123", "Corta12345!"))
                .isInstanceOf(WeakPasswordException.class).hasMessageContaining("12 caracteres");
        assertThatThrownBy(() -> PasswordPolicy.validate("ClaveActual123", "ClaveActual123"))
                .isInstanceOf(WeakPasswordException.class).hasMessageContaining("distinta");
        assertThatCode(() -> PasswordPolicy.validate("ClaveActual123", "OtraClaveNueva1")).doesNotThrowAnyException();
    }
}
