package pe.plataformacontenidos.shared;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();

    private String runAndCaptureMdc(MockHttpServletRequest request, MockHttpServletResponse response) throws Exception {
        AtomicReference<String> seen = new AtomicReference<>();
        filter.doFilter(request, response, new MockFilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) {
                seen.set(MDC.get(RequestIdFilter.MDC_KEY));
            }
        });
        return seen.get();
    }

    @Test
    void generatesAnIdAvailableInLogsAndResponse() throws Exception {
        var response = new MockHttpServletResponse();
        String inLogs = runAndCaptureMdc(new MockHttpServletRequest("GET", "/api/v1/feed"), response);

        assertThat(inLogs).isNotBlank();
        assertThat(response.getHeader(RequestIdFilter.HEADER)).isEqualTo(inLogs);
    }

    @Test
    void reusesTheProxyIdWhenItIsSafe() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/v1/feed");
        request.addHeader(RequestIdFilter.HEADER, "3f1c9a7e2b4d4f60a1b2c3d4e5f60718");
        var response = new MockHttpServletResponse();

        assertThat(runAndCaptureMdc(request, response)).isEqualTo("3f1c9a7e2b4d4f60a1b2c3d4e5f60718");
        assertThat(response.getHeader(RequestIdFilter.HEADER)).isEqualTo("3f1c9a7e2b4d4f60a1b2c3d4e5f60718");
    }

    @Test
    void ignoresUnsafeIdsToPreventLogForging() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/v1/feed");
        request.addHeader(RequestIdFilter.HEADER, "abc\n2026-10-06 ERROR falso");
        var response = new MockHttpServletResponse();

        String id = runAndCaptureMdc(request, response);
        assertThat(id).doesNotContain("\n").doesNotContain("falso").matches("[A-Za-z0-9-]{1,64}");
    }

    @Test
    void clearsTheIdAfterTheRequest() throws Exception {
        runAndCaptureMdc(new MockHttpServletRequest("GET", "/"), new MockHttpServletResponse());
        assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isNull();
    }
}
