package io.github.sotonush.navi.service.site.impl;

import io.github.sotonush.navi.config.properties.NaviProperties;
import io.github.sotonush.navi.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SiteServiceImplTest {

    @Test
    void injectsTheRequestOriginIntoPreviewTags() {
        SiteServiceImpl siteService = service("classpath:site/index.html");

        String html = siteService.index("https://navi.example");

        assertThat(html)
                .contains("content=\"https://navi.example/og.png\"")
                .contains("content=\"https://navi.example/\"")
                .doesNotContain("__ORIGIN__");
        assertThat(siteService.index("http://localhost:8080")).contains("http://localhost:8080/og.png");
    }

    @Test
    void reportsMissingFrontend() {
        assertThatThrownBy(() -> service("classpath:site/missing.html").index("https://navi.example"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private SiteServiceImpl service(String location) {
        NaviProperties properties = new NaviProperties(
                new NaviProperties.Traces(140, Duration.ofSeconds(60), 50),
                new NaviProperties.Wired(10, List.of("*"), Duration.ofMillis(50), Duration.ofMillis(400)),
                new NaviProperties.Site(location));
        return new SiteServiceImpl(new DefaultResourceLoader(), properties);
    }
}
