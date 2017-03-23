import express from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

import projConsts from '../src/constants';


// Jan. 1st, 2016
const MIN_TS = 1451635200;

// Jan. 1st, 2035
const MAX_TS = 2051251200

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
        res.status(400).send(JSON.stringify(new Error("New session must have start timestamp.")));
        return;
    } else if (isNaN(parseInt(body["start_ts"]))) {
        res.status(400).send(JSON.stringify(new Error("Start timestamp must be an integer.")));
        return;
    } else {
        startTs = parseInt(body["start_ts"]);

        if (startTs < MIN_TS || startTs > moment().unix()) {
            res.status(400).send(JSON.stringify(new Error("Timestamp out of range.")));
            return;
        }
    }

    let endTs;
    if (!body.hasOwnProperty("end_ts")) {
        endTs = null;
    } else if (isNaN(parseInt(body["end_ts"]))) {
        res.status(400).send(JSON.stringify(new Error("End timestamp must be an integer.")));
        return;
    } else {
        endTs = parseInt(body["start_ts"]);

        if (endTs > moment().unix()) {
            res.status(400).send(JSON.stringify(new Error("End timestamp cannot be in the future.")));
            return;
        } else if (endTs < startTs) {
            res.status(400).send(JSON.stringify(new Error("End timestamp must be greater than the start timestamp.")));
            return;
        }

    }

    let primTypeId;
    if (!body.hasOwnProperty("prim_type")) {
        res.status(400).send(JSON.stringify(new Error("Session must have primary type.")));
        return;
    } else if (isNaN(parseInt(body["prim_type"]))) {
        res.status(400).send(JSON.stringify(new Error("Primary type must be an integer.")));
        return;
    } else {
        primTypeId = parseInt(body["prim_type"]);
    }

    let secTypeId;
    if (body.hasOwnProperty("sec_type")) {
        if (isNaN(parseInt(body["second_type"]))) {
            res.status(400).send(JSON.stringify(new Error("Secondary type must be an integer.")));
            return;
        } else {
            secTypeId = parseInt(body["second_type"]);
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
        let trueEnd = endTs == null ? moment.unix(): endTs;
        let dayStart = moment.unix(startTs).seconds(0).hours(0);


        // grab
        //  1) existing sessions that have a start timestamp in the new session
        //  2) existing sessions that have an end timestamp in the new session
        //  3) existing sessions that contain the timestamps of the new session
        //  4) the active session (end timestamp is null) if it exists
        let queryTs = `SELECT session.start_ts, session.end_ts FROM sessions
                        WHERE session.start_ts >= ${startTs} AND session.start_ts <= ${trueEnd}
                        OR    session.end_ts >= ${startTs} AND session.end_ts <= ${trueEnd}
                        OR    session.start_ts <= ${startTs} AND session.end_ts >= ${trueEnd}
                        OR    session.end_ts IS NULL`;

        db.all(queryTs, undefined, function(err, rows) {
            if (err) {
                console.log(`Error querying database:\n${err}`);
                res.status(500).send(JSON.stringify(new Error("Error querying database for conflicting timestamps.")));
                return;
            }

            for (let i = 0; i < rows.length; i += 1) {
                dbRow = rows[i];


                if (endTs == null && dbRow["end_ts"] == null) {
                    res.status(400).send(JSON.stringify(new Error("Cannot start a new active session: end current session first.")));
                    return;
                }

                dbTrueEnd =  dbRow["end_ts"] == null ? moment.unix() : dbRow["end_ts"];

                if (dbRow["end_ts"] == null && endTs >= dbRow["start_ts"]) {
                    res.status(400).send(JSON.stringify(new Error("New session conflicts with the active session.")));
                    return;
                } else if (dbRow["start_ts"] >= startTs && dbRow["start_ts"] <= trueEnd
                    || dbTrueEnd >= startTs && dbTrueEnd <= trueEnd
                    || dbRow["start_ts"] <= startTs && dbTrueEnd >= trueEnd) {
                    res.status(400).send(JSON.stringify(new Error("New session conflicts with an existing session")));
                    return;
                }
            }
            resolve();
        });
    });

    let checkPrimTypeId = new Promise(function(resolve, reject) {
        let queryPrimType = `SELECT prim_type.id FROM prim_type WHERE prim_type.id = ${primTypeId}`;
        db.get(queryPrimType, undefined, function(err, row) {
            if (err) {
                console.log(`Error retrieving prim_type with id\n ${err}`);
                res.status(500).send(JSON.stringify(new Error("Error connecting to database.")));
                return;
            } else if (!row) {
                res.status(400).send(JSON.stringify(new Error("Primary type does not exist.")));
                return;
            } else {
                resolve();
            }
        });
    });

    let checkSecTypeId = new Promise(function(resolve, reject) {
        if (secTypeId == null) {
            resolve();
        }

        let querySecType = `SELECT prim_type.id from second_type WHERE second_type.id = ${secTypeId}`;
        db.get(querySecType, undefined, function(err, row) {
            if (err) {
                console.log(`Error retrieving second_type with id\n ${err}`);
                res.status(500).send(JSON.stringify(new Error("Error connecting to database.")));
                return;
            } else if (!row) {
                res.status(400).send(JSON.stringify(new Error("Secondary type does not exist.")));
                return;
            } else {
                resolve();
            }
        });
    });


    Promise.all([checkTsConflict, checkPrimTypeId,
        checkSecTypeId]).then(function(dataValues) {
        req["parsed_session"] = {
            "start_ts" : startTs,
            "end_ts" : endTs,
            "prim_type" : primTypeId,
            "sec_type" : secTypeId,
            "descr" : descr
        };
        next();
    });

}, function(req, res) {
    let sessionObj = req["parsed_session"];

    let insertQuery = `
            INSERT INTO session(start_ts, end_ts, prim_type_id, second_type_id, descr) VALUES
                (${sessionObj["start_ts"]}, ${sessionObj["end_ts"]}, ${sessionObj["prim_type_id"]},
                    ${sessionObj["second_type_id"]}, ${sessionObj["descr"]});
    `;

    db.run(insertQuery, undefined, function(err) {
        if (err) {
            throw err;
        }

        sessionObj["id"] = this.lastID;
        res.status(200).send(JSON.stringify(sessionObj));
    });
});

app.post(routes["ses"], function(req, res) {

    validate(routes["ses"], req);

    res.send();
});

app.post(routes["pri"], function(req, res) {
    res.send("Not implemented");
});

app.put(routes["sec"], function(req, res) {
    res.send("Not implemented");
});

app.put(routes["col"], function(req, res) {
    res.send("Not implemented");
});

app.delete(routes["ses"], function(req, res) {
    res.send("Not implemented.")
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

app.get("/query", function(req, res) {
    let validated = isValidQuery(req);
    if (!validated.success) {
        res.status(400).send("Invalid query request: " + validated["message"]);
        return;
    }

    queryDb(req["interval"], req["date"], function(err, data) {
        console.log(data);
        res.send(data);
    });

    res.send(ret);
});

app.get('/', function(req, res) {
    res.send("Hello world!");
});

// unit test
function isValidQuery(req) {
    let queryObj = req.query;
    let errorMessage = "";
    if (!(queryObj.hasOwnProperty("interval") && queryObj.hasOwnProperty("date"))) {
        errorMessage = "Missing query keys: should have entries for \'interval\' and \'date\'";
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

function queryDb(interval, start_ts, end_ts, cb) {
    if (interval == "d") {
        let end_ts = moment.unix(ts).add(1, 'day')
        let query = `
            SELECT sessions.*,
                    prim_type_expand.id AS prim_id, prim_type_expand.name AS prim_name, prim_type_expand.r AS prim_r, prim_type_expand.g AS prim_g, prim_type_expand.b AS prim_b,
                    second_type_expand.id AS second_id, second_type_expand.name AS sec_name, second_type_expand.r AS sec_r, second_type_expand.g AS sec_g, second_type_expand.b AS sec_b
            FROM sessions
            LEFT OUTER JOIN ( 
                SELECT prim_type.* FROM prim_type LEFT OUTER JOIN colors ON prim_type.r = colors.r AND prim_type.g = colors.g AND prim_type.b = colors.b
            ) prim_type_expand ON sessions.prim_type_id = prim_type_expand.id
            LEFT OUTER JOIN (
                SELECT second_type.* FROM second_type LEFT OUTER JOIN colors ON second_type.r = colors.r AND second_type.g = colors.g AND second_type.b = colors.b
            ) second_type_expand ON sessions.second_type_id = second_type_expand.id
            WHERE sessions.start_ts > ${start_ts} AND sessions.end_ts < ${end_ts}
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
            fs.mkdirSync(path.join(__dirname, 'db_data'));
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

    console.log("Database filepath is (input paths must be relative to project root): \"" + filePath + "\"");
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

    console.log(db);

    return app.listen(2999, "0.0.0.0", undefined, cb);

}

module.exports = app;