package io.github.sotonush.navi.service.trace;

import io.github.sotonush.navi.dto.trace.request.TraceCreateRequest;
import io.github.sotonush.navi.dto.trace.response.TraceResponse;

import java.util.List;

public interface TraceService {

    List<TraceResponse> feed();

    TraceResponse create(TraceCreateRequest request, String clientKey);
}
