package pe.plataformacontenidos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import pe.plataformacontenidos.identity.security.JwtAuthenticationFilter;
import pe.plataformacontenidos.identity.security.JwtService;

/**
 * Cadena de seguridad del monolito. Regla general: todo denegado salvo lo
 * explícitamente permitido (deny-by-default). El filtro JWT resuelve la
 * autenticación; las reglas de abajo resuelven la autorización por rol o
 * endpoint. Los matchers más específicos van primero (Spring evalúa en
 * orden y usa el primero que matchee).
 *
 * La autorización a nivel de objeto (ej. un AUTHOR solo puede editar SU
 * PROPIO artículo en DRAFT) no se puede expresar aquí — se resuelve en el
 * servicio de dominio (ver ArticleService), esta cadena solo decide quién
 * puede llegar al endpoint.
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // API sin estado basada en tokens; se reevalúa si se agregan endpoints basados en cookies/sesión
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categories", "/api/v1/categories/**", "/api/v1/tags")
                    .permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/articles", "/api/v1/articles/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/places", "/api/v1/places/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events", "/api/v1/events/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/galleries", "/api/v1/galleries/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/reviews", "/api/v1/reviews/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/directory", "/api/v1/directory/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/geography", "/api/v1/geography/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/images/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/platform-settings").permitAll()

                .requestMatchers("/api/v1/admin/users/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers("/api/v1/admin/platform-settings/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                // Audit log: incluye IPs y acciones de todos los usuarios (incluidos otros
                // admins) — sección 37, más sensible que un listado editorial normal.
                .requestMatchers("/api/v1/admin/audit/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers("/api/v1/admin/categories/**", "/api/v1/admin/tags/**", "/api/v1/admin/geography/**",
                        "/api/v1/admin/stats/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "EDITOR")
                .requestMatchers("/api/v1/admin/articles/**", "/api/v1/admin/images/**", "/api/v1/admin/places/**",
                        "/api/v1/admin/events/**", "/api/v1/admin/galleries/**", "/api/v1/admin/reviews/**",
                        "/api/v1/admin/directory/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR")

                .requestMatchers("/api/v1/users/me", "/api/v1/users/me/**").authenticated()
                .anyRequest().denyAll()
            )
            .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
