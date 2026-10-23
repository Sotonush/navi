package io.github.sotonush.navi.service.trace.impl;

import io.github.sotonush.navi.config.properties.NaviProperties;
import io.github.sotonush.navi.dto.trace.request.TraceCreateRequest;
import io.github.sotonush.navi.dto.trace.response.TraceResponse;
import io.github.sotonush.navi.dto.wired.TraceEvent;
import io.github.sotonush.navi.entity.trace.Trace;
import io.github.sotonush.navi.exception.TooManyRequestsException;
import io.github.sotonush.navi.exception.ValidationException;
import io.github.sotonush.navi.repository.trace.TraceRepository;
import io.github.sotonush.navi.service.presence.PresenceService;
import io.github.sotonush.navi.service.trace.TraceRateLimiter;
import io.github.sotonush.navi.support.MutableClock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class TraceServiceImplTest {

    private static final String CLIENT = "10.0.0.1";

    private TraceRepository traceRepository;
    private PresenceService presenceService;
    private MutableClock clock;
    private TraceServiceImpl traceService;

    @BeforeEach
    void setUp() {
        traceRepository = mock(TraceRepository.class);
        presenceService = mock(PresenceService.class);
        clock = new MutableClock(Instant.parse("2026-10-24T09:00:00Z"));
        NaviProperties properties = new NaviProperties(
                new NaviProperties.Traces(20, Duration.ofSeconds(60), 50),
                new NaviProperties.Wired(10, List.of("*"), Duration.ofMillis(50), Duration.ofMillis(400)));
        traceService = new TraceServiceImpl(traceRepository, presenceService,
                new TraceRateLimiter(properties, clock), properties, clock);
        when(traceRepository.save(any(Trace.class))).thenAnswer(invocation -> {
            Trace trace = invocation.getArgument(0);
            trace.setId(UUID.randomUUID());
            return trace;
        });
    }

    @Test
    void savesNormalizedTraceAndBroadcastsIt() {
        TraceResponse response = create(CLIENT, "  hello\n\twired  ");

        assertThat(response.message()).isEqualTo("hello wired");
        assertThat(response.handle()).isEqualTo("lain-0001");
        assertThat(response.createdAt()).isEqualTo(clock.instant());
        verify(presenceService).broadcast(TraceEvent.of(response));
    }

    @Test
    void rejectsLinks() {
        assertThatThrownBy(() -> create(CLIENT, "come to lain.io"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Links");
        assertThatThrownBy(() -> create(CLIENT, "https://example"))
                .isInstanceOf(ValidationException.class);
        verifyNoInteractions(presenceService);
    }

    @Test
    void rejectsTooLongAndBlankTraces() {
        assertThatThrownBy(() -> create(CLIENT, "x".repeat(21)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("20");
        assertThatThrownBy(() -> create(CLIENT, "\n\t "))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Trace is empty");
        verify(traceRepository, never()).save(any());
    }

    @Test
    void limitsTracesPerClient() {
        create(CLIENT, "first");

        assertThatThrownBy(() -> create(CLIENT, "second"))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessageContaining("60s");
        assertThat(create("10.0.0.2", "other client").message()).isEqualTo("other client");

        clock.advance(Duration.ofSeconds(60));
        assertThat(create(CLIENT, "again").message()).isEqualTo("again");
    }

    private TraceResponse create(String client, String message) {
        return traceService.create(new TraceCreateRequest("lain-0001", message), client);
    }
}
