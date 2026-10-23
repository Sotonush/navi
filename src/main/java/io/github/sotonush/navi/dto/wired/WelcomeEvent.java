package io.github.sotonush.navi.dto.wired;

import io.github.sotonush.navi.enums.wired.WiredEventType;

import java.util.List;

public record WelcomeEvent(WiredEventType type, VisitorResponse you, List<VisitorResponse> visitors) {

    public static WelcomeEvent of(VisitorResponse you, List<VisitorResponse> visitors) {
        return new WelcomeEvent(WiredEventType.WELCOME, you, visitors);
    }
}
