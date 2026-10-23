package io.github.sotonush.navi.dto.wired;

import io.github.sotonush.navi.enums.wired.WiredEventType;

public record SignalEvent(WiredEventType type, String id, double x, double y) {

    public static SignalEvent of(WiredEventType type, String id, double x, double y) {
        return new SignalEvent(type, id, x, y);
    }
}
