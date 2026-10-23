package io.github.sotonush.navi.repository.trace;

import io.github.sotonush.navi.entity.trace.Trace;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TraceRepository extends JpaRepository<Trace, UUID> {

    List<Trace> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
