package io.github.sotonush.navi.controller.trace;

import io.github.sotonush.navi.dto.trace.request.TraceCreateRequest;
import io.github.sotonush.navi.dto.trace.response.TraceResponse;
import io.github.sotonush.navi.service.trace.TraceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/traces")
@RequiredArgsConstructor
public class TraceController {

    private final TraceService traceService;

    @GetMapping
    public List<TraceResponse> feed() {
        return traceService.feed();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TraceResponse create(@Valid @RequestBody TraceCreateRequest request, HttpServletRequest servletRequest) {
        return traceService.create(request, servletRequest.getRemoteAddr());
    }
}
