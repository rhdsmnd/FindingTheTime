
CREATE TABLE IF NOT EXISTS colors(
    r INTEGER,
    g INTEGER,
    b INTEGER,
    PRIMARY KEY(r, g, b)
);

CREATE TABLE IF NOT EXISTS prim_type(
    id INTEGER PRIMARY KEY ASC AUTOINCREMENT,
    name text,
    r INTEGER NOT NULL,
    g INTEGER NOT NULL,
    b INTEGER NOT NULL,
    FOREIGN KEY(r, g, b) REFERENCES color(r, g, b)
);

CREATE TABLE IF NOT EXISTS second_type(
    id INTEGER PRIMARY KEY ASC AUTOINCREMENT,
    name text,
    r INTEGER NOT NULL,
    g INTEGER NOT NULL,
    b INTEGER NOT NULL,
    prim_type_id INTEGER NOT NULL,
    FOREIGN KEY(r, g, b) REFERENCES color(r, g, b),
    FOREIGN KEY(prim_type_id) REFERENCES prim_type(id)
);

CREATE TABLE IF NOT EXISTS session(
    id INTEGER PRIMARY KEY ASC AUTOINCREMENT,
    start_ts INTEGER,
    end_ts INTEGER,
    descr text,
    prim_type_id INTEGER,
    second_type_id INTEGER,
    FOREIGN KEY(prim_type_id) REFERENCES prim_type(id),
    FOREIGN KEY(second_type_id) REFERENCES second_type(id)
);

--CREATE TABLE IF NOT EXISTS other_types(
--    session_id INTEGER REFERENCES session(id),
--    type_id INTEGER REFERENCES type(id),
--    PRIMARY KEY(session_id, type_id)
--);