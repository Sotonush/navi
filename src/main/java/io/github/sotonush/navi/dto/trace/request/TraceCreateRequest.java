package io.github.sotonush.navi.dto.trace.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TraceCreateRequest(
        @NotBlank(message = "Handle is required")
        @Pattern(regexp = "[a-z0-9-]{3,24}", message = "Handle must be 3-24 chars: a-z, 0-9, -")
        String handle,
        @NotBlank(message = "Trace is empty")
        String message
) {
}
