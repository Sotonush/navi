package io.github.sotonush.navi.dto.wired;

import io.github.sotonush.navi.enums.wired.WiredEventType;

public record LeftEvent(WiredEventType type, String id) {

    public static LeftEvent of(String id) {
        return new LeftEvent(WiredEventType.LEFT, id);
    }
}
