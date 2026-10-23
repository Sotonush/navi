create table traces (
    id uuid primary key,
    handle varchar(24) not null,
    message varchar(280) not null,
    created_at timestamptz not null
);

create index idx_traces_created_at on traces (created_at desc);
