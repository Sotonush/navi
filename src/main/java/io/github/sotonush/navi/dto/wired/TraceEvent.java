package io.github.sotonush.navi.dto.wired;

import io.github.sotonush.navi.dto.trace.response.TraceResponse;
import io.github.sotonush.navi.enums.wired.WiredEventType;

public record TraceEvent(WiredEventType type, TraceResponse trace) {

    public static TraceEvent of(TraceResponse trace) {
        return new TraceEvent(WiredEventType.TRACE, trace);
    }
}
