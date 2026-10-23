package io.github.sotonush.navi.service.presence;

import java.time.Instant;

public record Visitor(String id, String handle, Instant connectedAt) {
}
