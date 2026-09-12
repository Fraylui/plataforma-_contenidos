package pe.plataformacontenidos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

// La autenticación es 100% JWT (ver SecurityConfig); sin esta exclusión Spring Security crea un usuario
// in-memory y escribe su contraseña generada en el log de arranque (ISO 27001 A.8.15: no registrar credenciales).
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
