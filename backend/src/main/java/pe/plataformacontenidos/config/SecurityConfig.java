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
import pe.plataformacontenidos.identity.permission.OwnerOnlyPaths;
import pe.plataformacontenidos.identity.permission.PermissionService;
import pe.plataformacontenidos.identity.security.AccountStateFilter;
import pe.plataformacontenidos.identity.security.RefreshTokenService;
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
    SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService, PermissionService permissionService,
            RefreshTokenService refreshTokenService) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // API sin estado basada en tokens; se reevalúa si se agregan endpoints basados en cookies/sesión
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categories", "/api/v1/categories/**")
                    .permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/articles", "/api/v1/articles/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/places", "/api/v1/places/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events", "/api/v1/events/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/galleries", "/api/v1/galleries/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/directory", "/api/v1/directory/**").permitAll()
                // "Me gusta" anónimo de lector (visitorId generado en el navegador, no requiere cuenta) — ver ContentLike, un solo mecanismo para los tipos de contenido.
                .requestMatchers(HttpMethod.POST, "/api/v1/articles/*/like", "/api/v1/places/*/like",
                        "/api/v1/events/*/like", "/api/v1/galleries/*/like",
                        "/api/v1/directory/*/like").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/feed", "/api/v1/feed/related", "/api/v1/feed/top",
                        "/api/v1/feed/topics").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/images/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/platform-settings").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/ad-placements").permitAll()
                // Publicidad directa: resolución de campaña activa y el redirect de clic los
                // consume cualquier lector anónimo (ver AdBlock), igual que ad-placements.
                .requestMatchers(HttpMethod.GET, "/api/v1/ads/campaigns/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/ads/campaigns/*/impression").permitAll()

                // Panel (spec 2a §4.1): las rutas exclusivas del dueño se exigen por rol;
                // el resto del panel exige sesión y cada endpoint declara su módulo con
                // @RequiresModule (ModuleAccessInterceptor, contra la base en cada petición).
                .requestMatchers(OwnerOnlyPaths.PATTERNS.toArray(String[]::new)).hasRole("OWNER")
                .requestMatchers("/api/v1/admin/**").authenticated()

                .requestMatchers("/api/v1/users/me", "/api/v1/users/me/**").authenticated()
                .anyRequest().denyAll()
            )
            .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class)
            // Después del token: cuenta desactivada → 401; contraseña temporal → solo puede cambiarla.
            .addFilterAfter(new AccountStateFilter(permissionService, refreshTokenService), JwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
