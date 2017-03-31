import express from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

import projConsts from '../constants';


// Jan. 1st, 2016: 8am
const MIN_TS = 1451635200;

// Jan. 1st, 2035: 8am
const MAX_TS = 2051251200;

var app = express();

var db;

var clicks = [];

var validator = function(req, res, next) {
    next();
}

var routes = {
    ses : "/sessions",
    col : "/colors",
    pri : "/primary_type",
    sec : "/secondary_type"
}

//app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

/**
 app.use(function (err, req, res, next) {
    console.log("--\n" + err + "---\n");
    next();
})
 */

// make sure requests have content type: application/json, and not application/x-www-form-urlencoded

app.put(routes["ses"], function(req, res, next) {
    let body = req["body"];

    let startTs;
    if (!body.hasOwnProperty("start_ts")) {
        res.status(400).send("New session must have start timestamp.");
        return;
    } else if (isNaN(parseInt(body["start_ts"]))) {
        res.status(400).send("Start timestamp must be an integer.");
        return;
    } else {
        startTs = parseInt(body["start_ts"]);

        if (startTs < MIN_TS || startTs > moment().unix()) {
            console.log(startTs);
            res.status(400).send("Timestamp out of range.");
            return;
        }
    }

    let endTs, now = moment().unix();
    if (!body.hasOwnProperty("end_ts")) {
        endTs = null;
    } else if (isNaN(parseInt(body["end_ts"]))) {
        res.status(400).send("End timestamp must be an integer.");
        return;
    } else {
        endTs = parseInt(body["end_ts"]);

        if (endTs > now) {
            res.status(400).send("End timestamp cannot be in the future.");
            return;
        } else if (endTs < startTs) {
            res.status(400).send("End timestamp must be greater than the start timestamp.");
            return;
        }

    }

    let primTypeId;
    if (!body.hasOwnProperty("prim_type_id")) {
        res.status(400).send("Session must have primary type.");
        return;
    } else if (isNaN(parseInt(body["prim_type_id"]))) {
        res.status(400).send("Primary type must be an integer.");
        return;
    } else {
        primTypeId = parseInt(body["prim_type_id"]);
    }

    let secTypeId;
    if (body.hasOwnProperty("sec_type_id")) {
        if (isNaN(parseInt(body["sec_type_id"]))) {
            res.status(400).send("Secondary type must be an integer.");
            return;
        } else {
            secTypeId = parseInt(body["sec_type_id"]);
        }
    } else {
        secTypeId = null;
    }

    let descr = "";
    if (body.hasOwnProperty("descr")) {
        // escape content?
        descr = body["descr"].toString();
    }

    // now check the values

    let checkTsConflict = new Promise(function(resolve, reject) {
        let trueEnd = (endTs == null) ? now : endTs;

        // grab
        //  1) existing sessions that have a start timestamp in the new session
        //  2) existing sessions that have an end timestamp in the new session
        //  3) existing sessions that contain the timestamps of the new session
        //  4) the active session (end timestamp is null) if it exists
        let queryTs = `SELECT sessions.start_ts, sessions.end_ts FROM sessions
                        WHERE sessions.start_ts >= ${startTs} AND sessions.start_ts <= ${trueEnd}
                        OR    sessions.end_ts >= ${startTs} AND sessions.end_ts <= ${trueEnd}
                        OR    sessions.start_ts <= ${startTs} AND sessions.end_ts >= ${trueEnd}
                        OR    sessions.end_ts IS NULL`;

        db.all(queryTs, undefined, function(err, rows) {
            if (err) {

                console.log(trueEnd);
                console.log(startTs);

                console.log(`Error querying database:\n${err}`);
                res.status(500).send("Error querying database for conflicting timestamps.");
                reject("Error querying database for conflicting timestamps.");
                return;
            }
            for (let i = 0; i < rows.length; i += 1) {

                let dbRow = rows[i];

                if (endTs == null && dbRow["end_ts"] == null) {
                    res.status(400).send("Cannot start a new active session: end current session first.");
                    reject("Cannot start a new active session: end current session first.");
                    return;
                }

                let dbTrueEnd =  dbRow["end_ts"] == null ? now : dbRow["end_ts"];

                if (dbRow["end_ts"] == null && endTs >= dbRow["start_ts"]) {
                    res.status(400).send("New session conflicts with the active sessions.");
                    reject("New session conflicts with the active sessions.");
                    return;
                } else if (endTs == null && dbRow["end_ts"] >= startTs) {
                    res.status(400).send("An existing sessions conflicts with new active session.");
                    reject("An existing sessions conflicts with new active session.");
                    return;
                } else if (dbRow["start_ts"] >= startTs && dbRow["start_ts"] <= trueEnd
                    || dbTrueEnd >= startTs && dbTrueEnd <= trueEnd
                    || dbRow["start_ts"] <= startTs && dbTrueEnd >= trueEnd) {
                    res.status(400).send("New session conflicts with an existing session");
                    reject("New session conflicts with an existing session");
                    return;
                }
            }
            resolve();
        });
    });

    let checkPrimTypeId = new Promise(function(resolve, reject) {
        let queryPrimType = `SELECT prim_type.id FROM prim_type WHERE prim_type.id = ${primTypeId};`;
        db.get(queryPrimType, undefined, function(err, row) {
            if (err) {
                console.log(`Error retrieving prim_type with id\n ${err}`);
                res.status(500).send("Error connecting to database.");
                reject(err);
            } else if (!row) {
                res.status(400).send("Primary type does not exist.");
                reject(err);
            } else {
                resolve();
            }
        });
    });

    let checkSecTypeId = new Promise(function(resolve, reject) {
        if (secTypeId == null) {
            resolve();
            return;
        }

        let querySecType = `SELECT second_type.id from second_type WHERE second_type.id = ${secTypeId}`;
        db.get(querySecType, undefined, function(err, row) {
            if (err) {
                console.log(`Error retrieving second_type with id\n ${err}`);
                res.status(500).send("Error connecting to database.");
                reject(err);
            } else if (!row) {
                res.status(400).send("Secondary type does not exist.");
                reject("Secondary type does not exist.");
            } else {
                resolve();
            }
        });
    });

    // handle promise failure
    Promise.all([checkTsConflict, checkPrimTypeId,
        checkSecTypeId]).then(function(dataValues) {
        req["parsed_session"] = {
            "start_ts" : startTs,
            "end_ts" : endTs,
            "prim_type_id" : primTypeId,
            "sec_type_id" : secTypeId,
            "descr" : descr
        };
        next();
    }, function(err) {
    });
}, function(req, res) {
    let sessionObj = req["parsed_session"];

    let insertQuery = `
            INSERT INTO sessions(start_ts, end_ts, prim_type_id, second_type_id, descr) VALUES
                (${sessionObj["start_ts"]}, ${sessionObj["end_ts"]}, ${sessionObj["prim_type_id"]},
                    ${sessionObj["sec_type_id"]}, "${sessionObj["descr"]}");
    `;

    db.run(insertQuery, undefined, function(err) {
        if (err) {
            console.log("Error inserting session.");
            throw err;
        }

        sessionObj["id"] = this.lastID;
        res.status(200).send();
    });
});

app.post(routes["ses"], function(req, res) {

    validate(routes["ses"], req);

    res.send();
});

app.put(routes["pri"], function(req, res, next) {
    let body = req["body"];

    if (!body.hasOwnProperty("name")) {
        res.status(400).send("Primary type must have a name.");
        return;
    }

    let primName = body["name"];

    if (!body.hasOwnProperty("r")) {
        res.status(400).send("Primary type must have red ('r') property.");
        return;
    } else if (isNaN(parseInt(body["r"])) || parseInt(body["r"] < 0 || parseInt(body["r"] > 255))) {
        res.status(400).send("Primary type must have a valid red value (0 - 255).");
        return;
    }

    let primR = parseInt(body["r"]);

    if (!body.hasOwnProperty("g")) {
        res.status(400).send("Primary type must have green ('g') property.");
        return;
    } else if (isNaN(parseInt(body["g"])) || parseInt(body["g"] < 0 || parseInt(body["g"] > 255))) {
        res.status(400).send("Primary type must have a valid green value (0 - 255).");
        return;
    }

    let primG = parseInt(body["g"]);

    if (!body.hasOwnProperty("b")) {
        res.status(400).send("Primary type must have blue ('b') property.");
        return;
    } else if (isNaN(parseInt(body["b"])) || parseInt(body["b"] < 0 || parseInt(body["b"] > 255))) {
        res.status(400).send("Primary type must have a valid blue value (0 - 255).");
        return;
    }

    let primB = parseInt(body["b"]);

    let colorCheck = new Promise(function(resolve, reject) {
       db.get(`SELECT prim_type.r, prim_type.g, prim_type.b FROM prim_type WHERE
                    prim_type.r = ${primR} AND prim_type.g = ${primG} AND prim_type.b = ${primB}`,
                    {}, function(err, row) {
            if (!row) {
                reject("Color for primary type does not exist.");
            } else {
                resolve();
            }
       });
    });
    colorCheck.then(function(data) {
        req["parsedPrimType"] = {
            "name" : primName,
            "r" : primR,
            "g" : primG,
            "b" : primB
        };
        next();
    }, function(err) {
        res.status(400).send(err);
    });

    next();
}, function(req, res) {
    db.run(`INSERT INTO prim_type(name, r, g, b) VALUES (${name}, ${r}, ${g}, ${b})`, {}, function(err) {
        if (err) {
            res.status(500).send("Error storing primary type in database.");
            return;
        } else {
            res.status(200).send();
        }
    })
});

app.put(routes["sec"], function(req, res, next) {
    let body = req["body"];

    if (!body.hasOwnProperty("name")) {
        res.status(400).send("Secondary type must have a name.");
        return;
    }

    let secName = body["name"];

    if (!body.hasOwnProperty("r")) {
        res.status(400).send("Secondary type must have red ('r') property.");
        return;
    } else if (isNaN(parseInt(body["r"])) || parseInt(body["r"] < 0 || parseInt(body["r"] > 255))) {
        res.status(400).send("Secondary type must have a valid red value (0 - 255).");
        return;
    }

    let secR = parseInt(body["r"]);

    if (!body.hasOwnProperty("g")) {
        res.status(400).send("Secondary type must have green ('g') property.");
        return;
    } else if (isNaN(parseInt(body["g"])) || parseInt(body["g"] < 0 || parseInt(body["g"] > 255))) {
        res.status(400).send("Secondary type must have a valid green value (0 - 255).");
        return;
    }

    let secG = parseInt(body["g"]);

    if (!body.hasOwnProperty("b")) {
        res.status(400).send("Secondary type must have blue ('b') property.");
        return;
    } else if (isNaN(parseInt(body["b"])) || parseInt(body["b"] < 0 || parseInt(body["b"] > 255))) {
        res.status(400).send("Secondary type must have a valid blue value (0 - 255).");
        return;
    }

    let secB = parseInt(body["b"]);

    if (!body.hasOwnProperty("prim_type_id")) {
        res.status(400).send("Secondary type must have a primary type id.");
        return;
    } else if (isNaN(parseInt(body["prim_type_id"]))) {
        res.status(400).send("Secondary type must have an integer as a primary type id.");
        return;
    }

    let primIdCheck = new Promise(function(resolve, reject) {
        db.get(`SELECT prim_type.id FROM prim_type WHERE prim_type.id = ${body["prim_type_id"]};`, {}, function(err, row) {
            if (!row) {
                reject("Primary type id does not exist.");
            } else {
                resolve();
            }
        });
    });

    let colorCheck = new Promise(function(resolve, reject) {
       db.get(`SELECT prim_type.r, prim_type.g, prim_type.b FROM prim_type WHERE
                    prim_type.r = ${primR} AND prim_type.g = ${primG} AND prim_type.b = ${primB}`,
                    {}, function(err, row) {
            if (!row) {
                reject("Color does not exist for secondary type.");
            } else {
                resolve();
            }
       });
    });

    Promise.all([primIdCheck, colorCheck]).then(function(values) {
        req["parsedSecType"] = {
            "name" : secName,
            "prim_type_id" : body["prim_type_id"],
            "r" : secR,
            "g" : secG,
            "b" : secB
        };
        next();
    }, function(err) {
        res.status(400).send(err);
    });
}, function(req, res) {
    let secType = req["parsedSecType"];

    db.run(`INSERT INTO second_type(name, prim_type_id, r, g, b)
                                    VALUES (${secType["name"]}, ${secType["prim_type_id"]}, ${secType["r"},
                                            ${secType["g"}, ${secType["b"})`, {}, function(err) {
        if (err) {
            res.status(500).send("Error storing secondary type in database.");
            return;
        } else {
            res.status(200).send();
        }
    })
});

app.put(routes["col"], function(req, res) {
    res.send("Not implemented");
});

app.delete(routes["ses"], function(req, res) {
    let body = req["body"];

    if (body.hasOwnProperty("id")) {
        if (isNaN(parseInt(body["id"]))) {
            res.status(400).send("Session id must be a number.");
            return;
        }

        db.run(`DELETE FROM sessions WHERE sessions.id = ${body["id"]}`, {}, function(err) {
            if (!err) {
                res.status(200).send(`Deleted session with id = ${body["id"]}`);
                return;
            } else {
                res.status(500).send(`Couldn't delete session with id = ${body["id"]}`);
                return;
            }
        });
    } else if (body.hasOwnProperty("start_ts")) {
        if (isNaN(parseInt(body["start_ts"]))) {
            res.status(400).send("Session start timestamp must be a number.");
            return;
        }

        db.run(`DELETE FROM sessions WHERE sessions.start_ts = ${body["start_ts"]}`, {}, function(err) {
            if (!err) {
                res.status(200).send(`Deleted session with start timestamp = ${body["start_ts"]}`);
                return;
            } else {
                res.status(500).send(`Couldn't delete session with start timestamp = ${body["start_ts"]}`);
                console.log(err);
                return;
            }
        });
    } else {
        res.status(400).send("DELETE body must have a session id or a start timestamp.");
    }
});

app.delete(routes["pri"], function(req, res) {
    res.send("Not implemented.")
});

app.delete(routes["sec"], function(req, res) {
    res.send("Not implemented.")
});

app.delete(routes["col"], function(req, res) {
    res.send("Not implemented.")
});

/**
 * Expects a query string with interval & date key values.
 */
app.get("/query", function(req, res) {
    let validated = isValidQuery(req);
    if (!validated.success) {
        res.status(400).send("Invalid query request: " + validated["message"]);
        return;
    }

    queryDb(req.query["interval"], req.query["date"], function(err, data) {
        if (!data) {
            data = "[]";
        }
        res.send(data);
    });
});

app.get('/', function(req, res) {
    res.send("Hello world!");
});

// unit test
function isValidQuery(req) {
    let queryObj = req.query;
    let errorMessage = "";
    if (!(queryObj.hasOwnProperty("interval") && queryObj.hasOwnProperty("date"))) {
        errorMessage = "Missing query keys: should have entries for 'interval' and 'date'";
    } else if (!(queryObj["interval"].match(/^[dwmy]$/) && queryObj["date"].match(/^\d+$/))) {
        errorMessage = "Invalid values in query string: interval should be one of 'd', 'm', 'w', 'y' " +
            "and date should be a unix timestamp.";
    }

    let ret = {};
    if (errorMessage == "") {
        ret["success"] = true;
    } else {
        ret["success"] = false;
        ret["message"] = errorMessage;
    }

    return ret;
}

function isValidUpdate(req) {

}

function isValidCreate(req) {

}

function queryDb(interval, ts, cb) {
    if (interval == "d") {
        let utcMoment = moment.unix(ts).minutes(0).seconds(0);

        let dayStart;
        if (utcMoment.hours() < 7) {
            dayStart = moment(utcMoment).subtract(1, 'days').hours(7);
        } else {
            dayStart = moment(utcMoment).hours(7);
        }
        let startTs = dayStart.unix();

        let endTs = dayStart.add(1, 'days').unix();

        let query = `
            SELECT sessions.*,
                    prim_type_expand.name AS prim_name, prim_type_expand.r AS prim_r, prim_type_expand.g AS prim_g, prim_type_expand.b AS prim_b,
                    second_type_expand.name AS sec_name, second_type_expand.r AS sec_r, second_type_expand.g AS sec_g, second_type_expand.b AS sec_b
            FROM sessions
            LEFT OUTER JOIN ( 
                SELECT prim_type.* FROM prim_type LEFT OUTER JOIN colors ON prim_type.r = colors.r AND prim_type.g = colors.g AND prim_type.b = colors.b
            ) prim_type_expand ON sessions.prim_type_id = prim_type_expand.id
            LEFT OUTER JOIN (
                SELECT second_type.* FROM second_type LEFT OUTER JOIN colors ON second_type.r = colors.r AND second_type.g = colors.g AND second_type.b = colors.b
            ) second_type_expand ON sessions.second_type_id = second_type_expand.id
            WHERE sessions.start_ts >= ${startTs} AND sessions.end_ts < ${endTs}
        `;
        db.all(query, undefined, cb);
    } else if (interval == 'w') {
        cb(null, []);
    } else if (interval == 'm') {
        cb(null, []);
    } else if (interval == 'y') {
        cb(null, []);
    } else {
        cb(new Error("Invalid interval for queryDb."), undefined);
    }
}

function getSessionsCb(err, rows) {
    if (err) {
        console.log(err);
        return [];
    }
}

function setupDb(filePath) {

    if (filePath == "") {
        try {
            fs.mkdirSync(projConsts["DB_DIR"]);
        } catch (err) {
            if (err["code"] != "EEXIST") {
                console.log(err);
                throw err;
            }
        }
        filePath = projConsts["DB_FILE"];
    } else {
        filePath = path.join(__dirname, filePath);
    }

    return new sqlite3.Database(filePath);
}

function isValidTs(ts) {
    let tsVal = parseInt(ts);
    // greater than January 1st, 2016
    return !isNan(tsVal) && tsVal < moment().unix() && tsVal > 	1451606400
}

app.start = function(dbPath, cb) {
    if (dbPath) {
        db = setupDb("../" + dbPath);
    } else {
        db = setupDb("");
    }

    console.log("Starting with database at : " + dbPath);
    return app.listen(2999, "0.0.0.0", undefined, cb);

}

module.exports = app;