package io.github.sotonush.navi;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class NaviIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    private final HttpClient http = HttpClient.newHttpClient();

    @LocalServerPort
    private int port;

    @Autowired
    private JsonMapper jsonMapper;

    @Test
    void traceIsStoredListedAndBroadcastToTheWired() throws Exception {
        Listener first = connect();
        JsonNode welcome = first.next();
        assertThat(welcome.get("type").asString()).isEqualTo("WELCOME");
        String handle = welcome.get("you").get("handle").asString();

        Listener second = connect();
        assertThat(second.next().get("type").asString()).isEqualTo("WELCOME");
        assertThat(first.next().get("type").asString()).isEqualTo("JOINED");

        HttpResponse<String> created = post("203.0.113.1", Map.of("handle", handle, "message", "present day, present time"));
        assertThat(created.statusCode()).isEqualTo(201);

        JsonNode event = first.next();
        assertThat(event.get("type").asString()).isEqualTo("TRACE");
        assertThat(event.get("trace").get("message").asString()).isEqualTo("present day, present time");
        assertThat(second.next().get("type").asString()).isEqualTo("TRACE");

        HttpResponse<String> feed = http.send(HttpRequest.newBuilder(uri("/api/traces")).GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertThat(feed.statusCode()).isEqualTo(200);
        assertThat(jsonMapper.readTree(feed.body()).get(0).get("handle").asString()).isEqualTo(handle);

        second.session.close();
        assertThat(first.next().get("type").asString()).isEqualTo("LEFT");
        first.session.close();
    }

    @Test
    void rejectsInvalidTracesAndLimitsRate() throws Exception {
        HttpResponse<String> link = post("203.0.113.2", Map.of("handle", "lain-0001", "message", "visit www.spam"));
        assertThat(link.statusCode()).isEqualTo(400);
        assertThat(jsonMapper.readTree(link.body()).get("message").asString()).contains("Links");

        assertThat(post("203.0.113.2", Map.of("handle", "Bad Handle", "message", "hi")).statusCode()).isEqualTo(400);

        assertThat(post("203.0.113.2", Map.of("handle", "lain-0001", "message", "hi")).statusCode()).isEqualTo(201);
        HttpResponse<String> limited = post("203.0.113.2", Map.of("handle", "lain-0001", "message", "hi again"));
        assertThat(limited.statusCode()).isEqualTo(429);
    }

    private HttpResponse<String> post(String forwardedFor, Map<String, String> body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri("/api/traces"))
                .header("Content-Type", "application/json")
                .header("X-Forwarded-For", forwardedFor)
                .POST(HttpRequest.BodyPublishers.ofString(jsonMapper.writeValueAsString(body)))
                .build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private Listener connect() throws Exception {
        Listener listener = new Listener();
        listener.session = new StandardWebSocketClient()
                .execute(listener, "ws://localhost:" + port + "/wired")
                .get(5, TimeUnit.SECONDS);
        return listener;
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    private class Listener extends TextWebSocketHandler {

        private final BlockingQueue<String> messages = new LinkedBlockingQueue<>();
        private WebSocketSession session;

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) {
            messages.add(message.getPayload());
        }

        JsonNode next() throws Exception {
            String payload = messages.poll(5, TimeUnit.SECONDS);
            assertThat(payload).as("event from the Wired").isNotNull();
            return jsonMapper.readTree(payload);
        }
    }
}
