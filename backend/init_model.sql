CREATE SCHEMA ftt;

CREATE TABLE ftt.color(
    r int,
    g int,
    b int,
    PRIMARY KEY(r, g, b)
);

CREATE TABLE ftt.type(
    id serial PRIMARY KEY,
    name text,
    r int NOT NULL,
    g int NOT NULL,
    b int NOT NULL,
    FOREIGN KEY(r, g, b) REFERENCES ftt.color(r, g, b)
);

CREATE TABLE ftt.session(
    id serial PRIMARY KEY,
    start_ts bigint,
    end_ts bigint,
    prim_type int REFERENCES ftt.type(id),
    descr text
);

CREATE TABLE ftt.other_types(
    session_id int REFERENCES ftt.session(id),
    type_id int REFERENCES ftt.type(id),
    PRIMARY KEY(session_id, type_id)
);