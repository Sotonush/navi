package io.github.sotonush.navi.entity.trace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "traces")
@Getter
@Setter
@NoArgsConstructor
public class Trace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 24)
    private String handle;

    @Column(nullable = false, length = 280)
    private String message;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
