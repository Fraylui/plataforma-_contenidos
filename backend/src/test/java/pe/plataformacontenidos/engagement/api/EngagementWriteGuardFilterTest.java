package pe.plataformacontenidos.engagement.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import pe.plataformacontenidos.shared.FixedWindowRateLimiter;

class EngagementWriteGuardFilterTest {

    private final FixedWindowRateLimiter limiter = mock(FixedWindowRateLimiter.class);
    private final EngagementWriteGuardFilter filter = new EngagementWriteGuardFilter(limiter, 30);

    @Test
    void soloVigilaLosMeGustaYLasReacciones() {
        assertThat(EngagementWriteGuardFilter.isEngagementWrite("POST", "/api/v1/reactions")).isTrue();
        assertThat(EngagementWriteGuardFilter.isEngagementWrite("POST", "/api/v1/places/mirador/like")).isTrue();
        assertThat(EngagementWriteGuardFilter.isEngagementWrite("GET", "/api/v1/reactions")).isFalse();
        assertThat(EngagementWriteGuardFilter.isEngagementWrite("POST", "/api/v1/admin/places")).isFalse();
    }

    @Test
    void dentroDelTopeCuentaYDejaPasar() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/reactions");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        when(limiter.isBlocked(anyString(), anyString(), eq(30))).thenReturn(false);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verify(limiter).recordAttempt(eq("engagement:rl:"), anyString(), eq(java.time.Duration.ofMinutes(1)));
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void pasadoElTopeResponde429SinTocarLasCifras() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/publications/x/like");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        when(limiter.isBlocked(anyString(), anyString(), eq(30))).thenReturn(true);

        filter.doFilter(request, response, chain);

        verify(chain, never()).doFilter(request, response);
        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("60");
        assertThat(response.getContentAsString()).contains("Demasiadas reacciones");
    }
}
