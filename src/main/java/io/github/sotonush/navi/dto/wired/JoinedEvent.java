package io.github.sotonush.navi.dto.wired;

import io.github.sotonush.navi.enums.wired.WiredEventType;

public record JoinedEvent(WiredEventType type, VisitorResponse visitor) {

    public static JoinedEvent of(VisitorResponse visitor) {
        return new JoinedEvent(WiredEventType.JOINED, visitor);
    }
}
