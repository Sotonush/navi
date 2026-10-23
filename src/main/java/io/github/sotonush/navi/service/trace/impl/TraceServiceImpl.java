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
import io.github.sotonush.navi.service.trace.TraceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class TraceServiceImpl implements TraceService {

    private static final Pattern CONTROL_CHARS = Pattern.compile("\\p{Cntrl}");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern LINK = Pattern.compile(
            "(?i)(https?://|www\\.|\\b[a-z0-9-]+\\.(com|ru|net|org|io|kg|me|xyz|app|dev|link|site)\\b)");

    private final TraceRepository traceRepository;
    private final PresenceService presenceService;
    private final TraceRateLimiter rateLimiter;
    private final NaviProperties properties;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<TraceResponse> feed() {
        return traceRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, properties.traces().feedSize())).stream()
                .map(TraceResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public TraceResponse create(TraceCreateRequest request, String clientKey) {
        String message = normalize(request.message());
        if (message.isEmpty()) {
            throw new ValidationException("Trace is empty");
        }
        int maxLength = properties.traces().maxLength();
        if (message.codePointCount(0, message.length()) > maxLength) {
            throw new ValidationException("Trace is longer than " + maxLength + " characters");
        }
        if (LINK.matcher(message).find()) {
            throw new ValidationException("Links are not allowed in the Wired");
        }
        rateLimiter.tryAcquire(clientKey).ifPresent(wait -> {
            throw new TooManyRequestsException("The Wired needs a moment. Try again in " + seconds(wait) + "s");
        });
        Trace trace = new Trace();
        trace.setHandle(request.handle());
        trace.setMessage(message);
        trace.setCreatedAt(clock.instant());
        TraceResponse response = TraceResponse.from(traceRepository.save(trace));
        presenceService.broadcast(TraceEvent.of(response));
        log.info("Новый след в Wired от {}", response.handle());
        return response;
    }

    private static String normalize(String message) {
        String withoutControl = CONTROL_CHARS.matcher(message).replaceAll(" ");
        return WHITESPACE.matcher(withoutControl).replaceAll(" ").strip();
    }

    private static long seconds(Duration wait) {
        return Math.max(1, (wait.toMillis() + 999) / 1000);
    }
}
