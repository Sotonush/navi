package io.github.sotonush.navi.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "app.navi")
public record NaviProperties(
        @DefaultValue Traces traces,
        @DefaultValue Wired wired,
        @DefaultValue Site site
) {

    public record Traces(
            @DefaultValue("140") int maxLength,
            @DefaultValue("60s") Duration cooldown,
            @DefaultValue("50") int feedSize
    ) {
    }

    public record Site(
            @DefaultValue("classpath:static/index.html") String indexLocation
    ) {
    }

    public record Wired(
            @DefaultValue("300") int maxVisitors,
            @DefaultValue("*") List<String> allowedOrigins,
            @DefaultValue("50ms") Duration cursorInterval,
            @DefaultValue("400ms") Duration pingInterval
    ) {
    }
}
