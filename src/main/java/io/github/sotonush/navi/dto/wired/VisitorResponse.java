package io.github.sotonush.navi.dto.wired;

import io.github.sotonush.navi.service.presence.Visitor;

import java.time.Instant;

public record VisitorResponse(String id, String handle, Instant connectedAt) {

    public static VisitorResponse from(Visitor visitor) {
        return new VisitorResponse(visitor.id(), visitor.handle(), visitor.connectedAt());
    }
}
