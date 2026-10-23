package io.github.sotonush.navi.service.site.impl;

import io.github.sotonush.navi.config.properties.NaviProperties;
import io.github.sotonush.navi.exception.ResourceNotFoundException;
import io.github.sotonush.navi.service.site.SiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
public class SiteServiceImpl implements SiteService {

    private static final String ORIGIN_PLACEHOLDER = "__ORIGIN__";

    private final ResourceLoader resourceLoader;
    private final NaviProperties properties;

    private final AtomicReference<String> template = new AtomicReference<>();

    @Override
    public String index(String origin) {
        return template().replace(ORIGIN_PLACEHOLDER, origin);
    }

    private String template() {
        String cached = template.get();
        if (cached != null) {
            return cached;
        }
        Resource resource = resourceLoader.getResource(properties.site().indexLocation());
        if (!resource.exists()) {
            throw new ResourceNotFoundException("Frontend is not built");
        }
        try {
            String content = resource.getContentAsString(StandardCharsets.UTF_8);
            template.set(content);
            return content;
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }
}
