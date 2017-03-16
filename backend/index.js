import express from 'express';
import bodyParser from 'body-parser';

import sqlite3 from 'sqlite3';

import fs from 'fs';
import path from 'path';


// Jan. 1st, 2016
const MIN_TS = 1451635200;

// Jan. 1st, 2035
const MAX_TS = 2051251200

var app = express();

var db;
if (process.argv.length == 3) {
    db = setupDb(process.argv[2]);
} else {
    db = setupDb("");
}

console.log(db);


var clicks = [];

var validator = function(req, res, next) {
    next();
}

var routes = {
    ses : {
        "path" : "/sessions",
        "POST" : {
            "validate" : function(req, res, next) {
                let body = req["body"];

                let isUpdate;
                if (body.hasOwnProperty("update")) {
                    isUpdateStr = body["update"];
                    if (isUpdateStr == "t" || "f") {
                        isUpdate = isUpdateStr == "t" ? true : false;
                    } else {
                        throw new Error("Invalid value for \"update\" key: must be \"t\" or \"f\"");
                    }
                } else {
                    throw new Error("Must indicate if creating or updating session");
                }

                let startTs;
                let endTs;

                    tsValidate = new Promise(function(resolve, reject) {
                        if (!body.hasOwnProperty("start_ts")) {
                            throw new Error("Must have start timestamp property.");
                        } else if (isNaN(parseInt(body["start_ts"]))) {
                            throw new Error("Start timestamp is not valid");
                        }

                        if (!body.hasOwnProperty("end_ts")) {
                            if (isUpdate)
                        }

                        db.all("")
                    });
                    let typeIdValidate = function (isPrimType) { return new Promise(function(resolve, reject) {

                    })};

                    let endTs = body["end_ts"], primTypeId = body["prim_type_id"],
                        secTypeId = body["sec_type_id"], descr = body["descr"];



                startTs = body["start_ts"];
                if (!isValidTs(startTs)) {
                    throw new Error("Start timestamp is invalid.");
                }



                if (isUpdate) {
                    let query = `SELECT * FROM sessions WHERE session.start_ts = ${startTs}`;
                    db.all(query, undefined, function() {

                    })
                } else {
                    let endTs;
                    if (body.hasOwnProperty("end_ts")) {
                        endTs = body["end_ts"];
                        if (!isValidTs(endTs)) {
                            throw new Error("End timestamp is invalid.");
                        }
                    } else {
                        let dayEnd = moment(startTs);

                        dayEnd.seconds(59);
                        dayEnd.hours(23);

                        endTs = dayEnd.unix();
                    }
                    let timeConflictQuery = `SELECT * FROM sessions
                                    WHERE
                                        sessions.start_ts > ${startTs} AND sessions.start_ts < ${endTs}
                                      OR
                                        sessions.end_ts > ${startTs} AND sessions.end_ts < ${endTs}
                    `;

                    let

                    db.all(timeConflictQuery, undefined, function (err, arr) {
                        if (err) {
                            throw new Error("Error querying database.");
                        } else {
                            if (arr.length > 0) {
                                throw new Error("Time conflict with another session.");
                            }
                        }

                        if (!body.hasOwnProperty("prim_type") || !isNan(parseInt(body["prim_type"]))) {
                            throw new Error("Primary type id is not valid.");
                        }

                        let primTypeQuery = `SELECT * FROM prim_type WHERE prim_type.id = ${body["prim_type"]}`;

                        db.get(primTypeQuery, undefined, function(err, row) {
                            if (err) {
                                throw new Error("Error retrieving primary type");
                            }

                        });
                    })
                }
                if (body.hasOwnProperty("prim_type_id")) {

                }

                if (!update) {
                    if (!body.hasOwnProperty("prim_type_id")) {
                        throw new Error("New session must have primary type.");
                    }

                    primTypeId =


                }
            }

        }
    },
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
        throw new Error("New session must have start timestamp.");
    } else if (isNaN(parseInt(body["start_ts"]))) {
        throw new Error("Start timestamp must be an integer.");
    } else {
        startTs = parseInt(body["start_ts"]);

        if (startTs < MIN_TS || startTs > moment().unix()) {
            throw new Error("Timestamp out of range.");
        }
    }

    let endTs;
    if (!body.hasOwnProperty("end_ts")) {
        endTs = null;
    } else if (isNaN(parseInt(body["end_ts"]))) {
        throw new Error("End timestamp must be an integer.");
    } else {
        endTs = parseInt(body["start_ts"]);

        if (endTs > moment().unix()) {
            throw new Error("End timestamp cannot be in the future.");
        } else if (endTs < startTs) {
            throw new Error("End timestamp must be greater than the start timestamp.");
        }

    }

    let primTypeId;
    if (!body.hasOwnProperty("prim_type")) {
        throw new Error("Session must have primary type.");
    } else if (isNaN(parseInt(body["prim_type"]))) {
        throw new Error("Primary type must be an integer.");
    } else {
        primTypeId = parseInt(body["prim_type"]);
    }

    let secTypeId;
    if (body.hasOwnProperty("sec_type")) {
        if (isNaN(parseInt(body["second_type"]))) {
            throw new Error("Secondary type must be an integer.");
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
        let trueEnd = endTs == null ? moment.unix(startTs).seconds(59).hours(23) : endTs;
        let dayStart = moment.unix(startTs).seconds(0).hours(0);


        // grab all sessions where
        //  1) existing sessions have a start timestamp in the new session
        //  2) existing sessions have an end timestamp in the new session
        //  3) there is an active session conflicting with the new session
        let queryTs = `SELECT session.start_ts, session.end_ts FROM sessions
                        WHERE session.start_ts > ${startTs} AND session.start_ts < ${trueEnd}
                        OR    session.end_ts > ${startTs} AND session.end_ts < ${trueEnd}
                        OR    session.end_ts IS NULL AND session.start_ts <= ${trueEnd})`;

        db.get(queryTs, undefined, function(err, row) {
            if (err) {
                console.log("Error querying database for conflicting timestamps.");
                throw err;
            } else if (row) {
                throw new Error(`Conflicting timestamp exists: [${row.start_ts},${row.end_ts}]`);
            } else {
                resolve();
            }
        });
    });

    let checkPrimTypeId = new Promise(function(resolve, reject) {
        resolve(null);
    });

    let checkSecTypeId = new Promise(function(resolve, reject) {
        resolve(null);
    });


    Promise.all([checkTsConflict, checkPrimTypeId,
                checkSecTypeId]).then(function(dataValues) {
        next();
    });

}, function(req, res) {

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


app.listen(2999, "0.0.0.0", undefined, function() {
    console.log("Web server started.")
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
        filePath = path.join(__dirname, 'db_data', 'db.sqlite3');
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



