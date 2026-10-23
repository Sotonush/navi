package io.github.sotonush.navi.dto.wired;

import io.github.sotonush.navi.enums.wired.WiredEventType;

public record SignalRequest(WiredEventType type, Double x, Double y) {

    public boolean hasValidPoint() {
        return x != null && y != null && x >= 0 && x <= 1 && y >= 0 && y <= 1;
    }
}
