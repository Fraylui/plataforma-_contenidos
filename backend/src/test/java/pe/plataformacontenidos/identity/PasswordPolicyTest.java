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

    @Test
    void rejectsPasswordsBCryptWouldTruncate() {
        String seventyTwoAscii = "a".repeat(72);
        assertThatCode(() -> PasswordPolicy.validate("ClaveActual123", seventyTwoAscii)).doesNotThrowAnyException();
        assertThatThrownBy(() -> PasswordPolicy.validate("ClaveActual123", seventyTwoAscii + "b"))
                .isInstanceOf(WeakPasswordException.class).hasMessageContaining("72");
        // 40 "ñ" son 40 caracteres pero 80 bytes.
        assertThatThrownBy(() -> PasswordPolicy.validate("ClaveActual123", "ñ".repeat(40)))
                .isInstanceOf(WeakPasswordException.class);
    }
}
