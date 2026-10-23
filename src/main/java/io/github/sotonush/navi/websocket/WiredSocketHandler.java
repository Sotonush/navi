package io.github.sotonush.navi.websocket;

import io.github.sotonush.navi.service.presence.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class WiredSocketHandler extends TextWebSocketHandler {

    private final PresenceService presenceService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        if (presenceService.connect(session).isEmpty()) {
            session.close(CloseStatus.SERVICE_OVERLOAD);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        presenceService.relay(session, message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        presenceService.disconnect(session);
    }
}
