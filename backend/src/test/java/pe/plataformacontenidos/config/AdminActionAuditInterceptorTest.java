package pe.plataformacontenidos.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerMapping;
import pe.plataformacontenidos.audit.AuditResult;
import pe.plataformacontenidos.audit.AuditService;
import pe.plataformacontenidos.identity.Role;
import pe.plataformacontenidos.identity.security.UserPrincipal;

class AdminActionAuditInterceptorTest {

    record Recorded(String action, AuditResult result, UUID actor, String email, String type, String id, String ip) {
    }

    private final List<Recorded> recorded = new ArrayList<>();
    private final AuditService audit = new AuditService(null) {
        @Override
        public void record(String action, AuditResult result, UUID actorUserId, String actorEmail,
                String resourceType, String resourceId, String ipAddress) {
            recorded.add(new Recorded(action, result, actorUserId, actorEmail, resourceType, resourceId, ipAddress));
        }
    };
    private final UUID adminId = UUID.randomUUID();
    private final AdminActionAuditInterceptor interceptor =
            new AdminActionAuditInterceptor(audit, id -> id.equals(adminId) ? Optional.of("dueno@ejemplo.com") : Optional.empty());

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequest adminRequest(String method, String uri, String pattern, Map<String, String> vars) {
        var request = new MockHttpServletRequest(method, uri);
        request.setRemoteAddr("190.12.34.56");
        request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE, pattern);
        request.setAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, vars);
        return request;
    }

    private void signIn() {
        var principal = new UserPrincipal(adminId, Role.OWNER);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }

    @Test
    void recordsAManualAdminActionWithActorResourceAndIp() throws Exception {
        signIn();
        String id = UUID.randomUUID().toString();
        var request = adminRequest("POST", "/api/v1/admin/articles/" + id + "/publish", "/api/v1/admin/articles/{id}/publish", Map.of("id", id));
        var response = new MockHttpServletResponse();
        response.setStatus(200);

        interceptor.afterCompletion(request, response, new Object(), null);

        assertThat(recorded).containsExactly(new Recorded("POST /admin/articles/{id}/publish", AuditResult.SUCCESS, adminId,
                "dueno@ejemplo.com", "articles", id, "190.12.34.56"));
    }

    @Test
    void recordsRejectedAttemptsAsFailure() throws Exception {
        signIn();
        var request = adminRequest("DELETE", "/api/v1/admin/campaigns/x", "/api/v1/admin/campaigns/{id}", Map.of("id", "x"));
        var response = new MockHttpServletResponse();
        response.setStatus(403);

        interceptor.afterCompletion(request, response, new Object(), null);

        assertThat(recorded).singleElement().satisfies(r -> {
            assertThat(r.result()).isEqualTo(AuditResult.FAILURE);
            assertThat(r.actor()).isEqualTo(adminId);
            assertThat(r.type()).isEqualTo("campaigns");
        });
    }

    @Test
    void ignoresReadsAndAnonymousPublicActions() throws Exception {
        // Me gusta, impresiones de anuncios: anónimos y masivos, no son acciones del panel.
        interceptor.afterCompletion(adminRequest("POST", "/api/v1/articles/x/like", "/api/v1/articles/{slug}/like", Map.of()),
                new MockHttpServletResponse(), new Object(), null);
        signIn();
        interceptor.afterCompletion(adminRequest("GET", "/api/v1/admin/articles", "/api/v1/admin/articles", Map.of()),
                new MockHttpServletResponse(), new Object(), null);

        assertThat(recorded).isEmpty();
    }

    @Test
    void recordsPanelActionsOutsideTheAdminPrefix() throws Exception {
        signIn();
        var request = adminRequest("PUT", "/api/v1/categories/c1", "/api/v1/categories/{id}", Map.of("id", "c1"));

        interceptor.afterCompletion(request, new MockHttpServletResponse(), new Object(), null);

        assertThat(recorded).singleElement().satisfies(r -> {
            assertThat(r.action()).isEqualTo("PUT /categories/{id}");
            assertThat(r.type()).isEqualTo("categories");
            assertThat(r.id()).isEqualTo("c1");
        });
    }

    @Test
    void doesNotDuplicateActionsThatAlreadyHaveTheirOwnAuditEvent() throws Exception {
        signIn();
        var request = adminRequest("POST", "/api/v1/admin/users", "/api/v1/admin/users", Map.of());
        request.setAttribute(AuditService.RECORDED_ATTRIBUTE, Boolean.TRUE);

        interceptor.afterCompletion(request, new MockHttpServletResponse(), new Object(), null);

        assertThat(recorded).isEmpty();
    }
}
