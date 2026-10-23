package io.github.sotonush.navi.config;

import io.github.sotonush.navi.config.properties.NaviProperties;
import io.github.sotonush.navi.websocket.WiredSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private static final String WIRED_PATH = "/wired";

    private final WiredSocketHandler wiredSocketHandler;
    private final NaviProperties properties;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(wiredSocketHandler, WIRED_PATH)
                .setAllowedOriginPatterns(properties.wired().allowedOrigins().toArray(String[]::new));
    }
}
