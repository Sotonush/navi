package io.github.sotonush.navi.service.presence.impl;

import io.github.sotonush.navi.config.properties.NaviProperties;
import io.github.sotonush.navi.service.presence.HandleGenerator;
import io.github.sotonush.navi.support.MutableClock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PresenceServiceImplTest {

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    private PresenceServiceImpl presenceService;
    private MutableClock clock;

    @BeforeEach
    void setUp() {
        NaviProperties properties = new NaviProperties(
                new NaviProperties.Traces(140, Duration.ofSeconds(60), 50),
                new NaviProperties.Wired(2, List.of("*"), Duration.ofMillis(50), Duration.ofMillis(400)),
                new NaviProperties.Site("classpath:static/index.html"));
        clock = new MutableClock(Instant.parse("2026-10-24T09:00:00Z"));
        presenceService = new PresenceServiceImpl(new HandleGenerator(), jsonMapper, properties, clock);
    }

    @Test
    void connectSendsWelcomeAndNotifiesOthers() throws Exception {
        WebSocketSession first = session("first");
        WebSocketSession second = session("second");

        presenceService.connect(first);
        presenceService.connect(second);

        assertThat(types(first)).containsExactly("WELCOME", "JOINED");
        List<JsonNode> secondEvents = events(second);
        assertThat(secondEvents).extracting(event -> event.get("type").asString()).containsExactly("WELCOME");
        assertThat(secondEvents.getFirst().get("visitors")).hasSize(1);
        assertThat(secondEvents.getFirst().get("you").get("handle").asString()).matches("[a-z]+-[0-9a-f]{4}");
    }

    @Test
    void rejectsVisitorsWhenTheWiredIsFull() throws Exception {
        presenceService.connect(session("first"));
        presenceService.connect(session("second"));
        WebSocketSession third = session("third");

        assertThat(presenceService.connect(third)).isEmpty();
        verify(third, never()).sendMessage(any());
        assertThat(presenceService.visitors()).hasSize(2);
    }

    @Test
    void disconnectNotifiesTheRest() throws Exception {
        WebSocketSession first = session("first");
        WebSocketSession second = session("second");
        presenceService.connect(first);
        presenceService.connect(second);

        presenceService.disconnect(second);

        assertThat(types(first)).containsExactly("WELCOME", "JOINED", "LEFT");
        assertThat(presenceService.visitors()).hasSize(1);
    }

    @Test
    void relaysCursorsToOthersWithThrottling() throws Exception {
        WebSocketSession first = session("first");
        WebSocketSession second = session("second");
        presenceService.connect(first);
        presenceService.connect(second);
        String secondId = events(second).getFirst().get("you").get("id").asString();

        presenceService.relay(second, "{\"type\":\"CURSOR\",\"x\":0.123456,\"y\":0.5}");
        presenceService.relay(second, "{\"type\":\"CURSOR\",\"x\":0.2,\"y\":0.5}");
        clock.advance(Duration.ofMillis(60));
        presenceService.relay(second, "{\"type\":\"PING\",\"x\":0.9,\"y\":0.1}");

        List<JsonNode> received = events(first);
        assertThat(received).extracting(event -> event.get("type").asString())
                .containsExactly("WELCOME", "JOINED", "CURSOR", "PING");
        JsonNode cursor = received.get(2);
        assertThat(cursor.get("id").asString()).isEqualTo(secondId);
        assertThat(cursor.get("x").asDouble()).isEqualTo(0.1235);
        assertThat(types(second)).containsExactly("WELCOME");
    }

    @Test
    void ignoresInvalidSignals() throws Exception {
        WebSocketSession first = session("first");
        WebSocketSession second = session("second");
        presenceService.connect(first);
        presenceService.connect(second);

        presenceService.relay(second, "not json");
        presenceService.relay(second, "{\"type\":\"CURSOR\",\"x\":1.5,\"y\":0.5}");
        presenceService.relay(second, "{\"type\":\"TRACE\",\"x\":0.5,\"y\":0.5}");
        presenceService.relay(second, "{\"type\":\"CURSOR\"}");
        presenceService.relay(session("stranger"), "{\"type\":\"CURSOR\",\"x\":0.5,\"y\":0.5}");

        assertThat(types(first)).containsExactly("WELCOME", "JOINED");
    }

    private WebSocketSession session(String id) {
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn(id);
        when(session.isOpen()).thenReturn(true);
        return session;
    }

    private List<String> types(WebSocketSession session) throws Exception {
        return events(session).stream().map(event -> event.get("type").asString()).toList();
    }

    private List<JsonNode> events(WebSocketSession session) throws Exception {
        ArgumentCaptor<TextMessage> captor = ArgumentCaptor.forClass(TextMessage.class);
        verify(session, atLeast(1)).sendMessage(captor.capture());
        return captor.getAllValues().stream().map(message -> jsonMapper.readTree(message.getPayload())).toList();
    }
}
