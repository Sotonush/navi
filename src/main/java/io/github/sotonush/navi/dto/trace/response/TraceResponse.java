package io.github.sotonush.navi.dto.trace.response;

import io.github.sotonush.navi.entity.trace.Trace;

import java.time.Instant;
import java.util.UUID;

public record TraceResponse(UUID id, String handle, String message, Instant createdAt) {

    public static TraceResponse from(Trace trace) {
        return new TraceResponse(trace.getId(), trace.getHandle(), trace.getMessage(), trace.getCreatedAt());
    }
}
