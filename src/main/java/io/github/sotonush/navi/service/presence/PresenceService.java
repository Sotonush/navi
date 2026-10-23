package io.github.sotonush.navi.service.presence;

import io.github.sotonush.navi.dto.wired.VisitorResponse;
import org.springframework.web.socket.WebSocketSession;

import java.util.List;
import java.util.Optional;

public interface PresenceService {

    Optional<Visitor> connect(WebSocketSession session);

    void disconnect(WebSocketSession session);

    void broadcast(Object event);

    void relay(WebSocketSession session, String payload);

    List<VisitorResponse> visitors();
}
