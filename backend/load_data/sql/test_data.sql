-- NOTES: to display data: either [sqlite3 -header -column filename] or [sqlite3 filename -> ".mode column" ".headers on"], then ".schema"   "SELECT * from sessions"


-- Create model --

CREATE TABLE IF NOT EXISTS colors (
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

CREATE TABLE IF NOT EXISTS sessions(
    id INTEGER PRIMARY KEY ASC AUTOINCREMENT,
    start_ts INTEGER,
    end_ts INTEGER,
    descr text,
    prim_type_id INTEGER,
    second_type_id INTEGER,
    FOREIGN KEY(prim_type_id) REFERENCES prim_type(id),
    FOREIGN KEY(second_type_id) REFERENCES second_type(id)
);


-- insert colors --
INSERT INTO colors(r, g, b) VALUES (179,161,131);
INSERT INTO colors(r, g, b) VALUES (174,142,94);
INSERT INTO colors(r, g, b) VALUES (80,57,49);
INSERT INTO colors(r, g, b) VALUES (180,176,173);
INSERT INTO colors(r, g, b) VALUES (185,187,226);
INSERT INTO colors(r, g, b) VALUES (59,40,96);
INSERT INTO colors(r, g, b) VALUES (33,64,95);
INSERT INTO colors(r, g, b) VALUES (107,143,221);
INSERT INTO colors(r, g, b) VALUES (199,227,220);
INSERT INTO colors(r, g, b) VALUES (75,196,212);
INSERT INTO colors(r, g, b) VALUES (0,126,135);
INSERT INTO colors(r, g, b) VALUES (141,236,120);
INSERT INTO colors(r, g, b) VALUES (181,198,130);
INSERT INTO colors(r, g, b) VALUES (95,135,85);
INSERT INTO colors(r, g, b) VALUES (212,161,80);
INSERT INTO colors(r, g, b) VALUES (255,226,0);
INSERT INTO colors(r, g, b) VALUES (255,237,153);
INSERT INTO colors(r, g, b) VALUES (255,130,1);
INSERT INTO colors(r, g, b) VALUES (146,21,37);
INSERT INTO colors(r, g, b) VALUES (108,78,80);
INSERT INTO colors(r, g, b) VALUES (221,181,187);
INSERT INTO colors(r, g, b) VALUES (234,62,122);

-- insert primary types --
INSERT INTO prim_type(name, r, g, b)
    VALUES("coding", 179, 161, 131);
INSERT INTO prim_type(name, r, g, b)
    VALUES("hobbies", 174, 142, 94);
INSERT INTO prim_type(name, r, g, b)
    VALUES("exercise", 80, 57, 49);
INSERT INTO prim_type(name, r, g, b)
    VALUES("free time", 180, 176, 173);

-- insert secondary types --
INSERT INTO second_type(name, r, g, b, prim_type_id)
    VALUES("database", 185, 187, 226, (SELECT
            prim_type.id FROM prim_type WHERE prim_type.name="coding"));
INSERT INTO second_type(name, r, g, b, prim_type_id)
    VALUES("web server", 59, 40, 96, (SELECT
            prim_type.id FROM prim_type WHERE prim_type.name="coding"));
INSERT INTO second_type(name, r, g, b, prim_type_id)
    VALUES("writing", 33, 64, 95, (SELECT
            prim_type.id FROM prim_type WHERE prim_type.name="hobbies"));
INSERT INTO second_type(name, r, g, b, prim_type_id)
    VALUES("composing", 107, 143, 221, (SELECT
            prim_type.id FROM prim_type WHERE prim_type.name="hobbies"));
INSERT INTO second_type(name, r, g, b, prim_type_id)
    VALUES("tempo run", 199, 227, 220, (SELECT
            prim_type.id FROM prim_type WHERE prim_type.name="exercise"));
INSERT INTO second_type(name, r, g, b, prim_type_id)
    VALUES("long run", 75, 196, 212, (SELECT
            prim_type.id FROM prim_type WHERE prim_type.name="exercise"));
INSERT INTO second_type(name, r, g, b, prim_type_id)
    VALUES("overwatch", 0, 126, 135, (SELECT
            prim_type.id FROM prim_type WHERE prim_type.name="free time"));
INSERT INTO second_type(name, r, g, b, prim_type_id)
    VALUES("youtube videos", 141, 236, 120, (SELECT
            prim_type.id FROM prim_type WHERE prim_type.name="free time"));


-- 8:00 am
-- 1457251200

--1457251200, 1457251500
--1457252000, 1457252100
--1457253200, 1457253900
--1457264000, 1457268500
--1457269200, 1457271500
--1457281200, 1457286500
--1457289200, 1457291500
--1457291200, 1457293500
--1457294200, 1457297500
--1457298200, 1457299000

-- 11:59 pm
-- 1457308799

INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id, second_type_id) VALUES
    (
        1457251200,
        1457251500,
        "",
        (SELECT prim_type.id FROM prim_type WHERE prim_type.name="coding"),
        (SELECT second_type.id FROM second_type WHERE second_type.name="web server")
    );

INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id, second_type_id) VALUES
    (
        1457252000,
        1457252100,
        "",
        (SELECT prim_type.id FROM prim_type WHERE prim_type.name="coding"),
        (SELECT second_type.id FROM second_type WHERE second_type.name="database")
    );

INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id, second_type_id) VALUES
    (
        1457264000,
        1457268500,
        "",
        (SELECT prim_type.id FROM prim_type WHERE prim_type.name="exercise"),
        (SELECT second_type.id FROM second_type WHERE second_type.name="long run")
    );

INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id, second_type_id) VALUES
    (
        1457289200,
        1457291500,
        "",
        (SELECT prim_type.id FROM prim_type WHERE prim_type.name="free time"),
        (SELECT second_type.id FROM second_type WHERE second_type.name="overwatch")
    );

