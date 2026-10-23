package io.github.sotonush.navi.service.trace;

import io.github.sotonush.navi.config.properties.NaviProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class TraceRateLimiter {

    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final NaviProperties properties;
    private final Clock clock;

    private final Map<String, Instant> lastTraceAt = new ConcurrentHashMap<>();

    public Optional<Duration> tryAcquire(String clientKey) {
        Instant now = clock.instant();
        Duration cooldown = properties.traces().cooldown();
        if (lastTraceAt.size() > MAX_TRACKED_CLIENTS) {
            lastTraceAt.values().removeIf(at -> at.plus(cooldown).isBefore(now));
        }
        Instant previous = lastTraceAt.get(clientKey);
        if (previous != null && previous.plus(cooldown).isAfter(now)) {
            return Optional.of(Duration.between(now, previous.plus(cooldown)));
        }
        lastTraceAt.put(clientKey, now);
        return Optional.empty();
    }
}
