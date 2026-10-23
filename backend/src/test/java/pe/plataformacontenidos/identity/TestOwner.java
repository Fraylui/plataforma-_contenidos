package pe.plataformacontenidos.identity;

import pe.plataformacontenidos.identity.internal.User;
import pe.plataformacontenidos.identity.internal.UserRepository;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

/**
 * El dueño de la plataforma en las pruebas. La base admite UNO solo (V66,
 * índice único parcial) y todas las clases comparten la misma base de
 * Testcontainers, así que nadie crea su propio dueño: la primera prueba que
 * lo necesita lo crea y las demás lo reutilizan. Ninguna prueba debe cambiar
 * su contraseña ni desactivarlo.
 */
public final class TestOwner {

    public static final String EMAIL = "dueno@plataforma-contenidos.test";
    public static final String PASSWORD = "DuenoDePrueba2026!";

    private static final Pattern ACCESS_TOKEN = Pattern.compile("\"accessToken\":\"([^\"]+)\"");

    private TestOwner() {
    }

    /** El único dueño: lo crea si todavía no existe. */
    public static synchronized User ensure(UserRepository users, PasswordEncoder encoder) {
        return users.findByEmailIgnoreCase(EMAIL).orElseGet(() -> {
            if (users.existsByRole(Role.OWNER)) {
                throw new IllegalStateException("Ya hay un dueño que no es el de prueba: créalo solo con TestOwner.");
            }
            return users.save(new User(EMAIL, encoder.encode(PASSWORD), "Dueño", "De prueba", Role.OWNER));
        });
    }

    /** Inicia sesión como el dueño y devuelve su access token. */
    public static String login(MockMvc mockMvc, UserRepository users, PasswordEncoder encoder) throws Exception {
        ensure(users, encoder);
        String body = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Matcher token = ACCESS_TOKEN.matcher(body);
        if (!token.find()) {
            throw new IllegalStateException("El login del dueño no devolvió accessToken: " + body);
        }
        return token.group(1);
    }
}
