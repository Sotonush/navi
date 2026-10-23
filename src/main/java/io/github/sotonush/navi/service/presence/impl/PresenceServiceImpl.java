package io.github.sotonush.navi.service.presence.impl;

import io.github.sotonush.navi.config.properties.NaviProperties;
import io.github.sotonush.navi.dto.wired.JoinedEvent;
import io.github.sotonush.navi.dto.wired.LeftEvent;
import io.github.sotonush.navi.dto.wired.SignalEvent;
import io.github.sotonush.navi.dto.wired.SignalRequest;
import io.github.sotonush.navi.dto.wired.VisitorResponse;
import io.github.sotonush.navi.dto.wired.WelcomeEvent;
import io.github.sotonush.navi.enums.wired.WiredEventType;
import io.github.sotonush.navi.service.presence.HandleGenerator;
import io.github.sotonush.navi.service.presence.PresenceService;
import io.github.sotonush.navi.service.presence.Visitor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class PresenceServiceImpl implements PresenceService {

    private static final int SEND_TIME_LIMIT_MS = 2_000;
    private static final int BUFFER_SIZE_LIMIT = 64 * 1024;
    private static final int MAX_SIGNAL_LENGTH = 256;
    private static final double PRECISION = 10_000d;

    private final HandleGenerator handleGenerator;
    private final JsonMapper jsonMapper;
    private final NaviProperties properties;
    private final Clock clock;

    private final Map<String, Connection> connections = new ConcurrentHashMap<>();

    @Override
    public Optional<Visitor> connect(WebSocketSession session) {
        if (connections.size() >= properties.wired().maxVisitors()) {
            return Optional.empty();
        }
        Visitor visitor = new Visitor(UUID.randomUUID().toString(), handleGenerator.next(), clock.instant());
        Connection connection = new Connection(
                new ConcurrentWebSocketSessionDecorator(session, SEND_TIME_LIMIT_MS, BUFFER_SIZE_LIMIT), visitor);
        VisitorResponse you = VisitorResponse.from(visitor);
        send(connection, WelcomeEvent.of(you, visitors()));
        connections.put(session.getId(), connection);
        broadcastExcept(session.getId(), JoinedEvent.of(you));
        return Optional.of(visitor);
    }

    @Override
    public void disconnect(WebSocketSession session) {
        Connection connection = connections.remove(session.getId());
        if (connection != null) {
            broadcast(LeftEvent.of(connection.visitor().id()));
        }
    }

    @Override
    public void broadcast(Object event) {
        broadcastExcept(null, event);
    }

    @Override
    public void relay(WebSocketSession session, String payload) {
        Connection connection = connections.get(session.getId());
        if (connection == null || payload.length() > MAX_SIGNAL_LENGTH) {
            return;
        }
        SignalRequest signal;
        try {
            signal = jsonMapper.readValue(payload, SignalRequest.class);
        } catch (JacksonException exception) {
            return;
        }
        if (!signal.hasValidPoint() || !connection.allow(signal.type(), clock.instant(), properties.wired())) {
            return;
        }
        broadcastExcept(session.getId(), SignalEvent.of(signal.type(), connection.visitor().id(),
                round(signal.x()), round(signal.y())));
    }

    @Override
    public List<VisitorResponse> visitors() {
        return connections.values().stream()
                .map(Connection::visitor)
                .sorted(Comparator.comparing(Visitor::connectedAt))
                .map(VisitorResponse::from)
                .toList();
    }

    private void broadcastExcept(String excludedSessionId, Object event) {
        TextMessage message = new TextMessage(jsonMapper.writeValueAsString(event));
        connections.forEach((sessionId, connection) -> {
            if (!sessionId.equals(excludedSessionId)) {
                send(connection, message);
            }
        });
    }

    private void send(Connection connection, Object event) {
        send(connection, new TextMessage(jsonMapper.writeValueAsString(event)));
    }

    private void send(Connection connection, TextMessage message) {
        try {
            connection.session().sendMessage(message);
        } catch (IOException | IllegalStateException exception) {
            log.debug("Не удалось отправить событие посетителю {}: {}", connection.visitor().handle(), exception.getMessage());
        }
    }

    private static double round(double value) {
        return Math.round(value * PRECISION) / PRECISION;
    }

    private static final class Connection {

        private final WebSocketSession session;
        private final Visitor visitor;
        private Instant lastCursorAt = Instant.EPOCH;
        private Instant lastPingAt = Instant.EPOCH;

        private Connection(WebSocketSession session, Visitor visitor) {
            this.session = session;
            this.visitor = visitor;
        }

        private WebSocketSession session() {
            return session;
        }

        private Visitor visitor() {
            return visitor;
        }

        private synchronized boolean allow(WiredEventType type, Instant now, NaviProperties.Wired limits) {
            if (type == WiredEventType.CURSOR) {
                if (Duration.between(lastCursorAt, now).compareTo(limits.cursorInterval()) < 0) {
                    return false;
                }
                lastCursorAt = now;
                return true;
            }
            if (type == WiredEventType.PING) {
                if (Duration.between(lastPingAt, now).compareTo(limits.pingInterval()) < 0) {
                    return false;
                }
                lastPingAt = now;
                return true;
            }
            return false;
        }
    }
}
