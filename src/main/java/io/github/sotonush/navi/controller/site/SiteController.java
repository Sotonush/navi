package io.github.sotonush.navi.controller.site;

import io.github.sotonush.navi.service.site.SiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequiredArgsConstructor
public class SiteController {

    private final SiteService siteService;

    @GetMapping(value = {"/", "/index.html"}, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> index() {
        String origin = ServletUriComponentsBuilder.fromCurrentContextPath().toUriString();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache())
                .body(siteService.index(origin));
    }
}
