import express from 'express';
import sqlite3 from 'sqlite3';

import fs from 'fs';
import path from 'path';

var app = express();

var db;
if (process.argv.length == 3) {
    db = setupDb(process.argv[2]);
} else {
    db = setupDb("");
}

console.log(db);


var clicks = [];


app.get("/query", function(req, res) {
    let validated = isValidQuery(req);
    if (!validated.success) {
        res.status(400).send("Invalid query request: " + validated["message"]);
        return;
    }

    ret = queryDb(req["interval"], req["date"]);

    res.send(ret);
});

app.get('/', function(req, res) {
    res.send("Hello world!");
});


app.listen(2999, function() {
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

function queryDb(interval, start_ts) {
    if (interval == "d") {
        let end_ts = moment(ts).add(1, 'day')
        let query = `SELECT session.start_ts, session.end_ts, prim_type.name, prim_type.r, prim_type.g, prim_type.b, second_type.name, second_type.r, second_type.g, second_type.b, session.descr
                        FROM session, prim_type, second_type, color
                        WHERE session.start_ts > ${start_ts} AND session.end_ts < ${end_ts}
                            AND session.prim_type_id = prim_type.id
                            AND session.second_type_id = second_type.id
                            AND prim_type.r = color.r AND prim_type.g = color.g AND prim_type.b = color.b
                            AND second_type.r = color.r AND second_type.g = color.g AND second_type.b = color.b
            `;
        return db.all(query)
    } else if (interval == 'w') {
        return [];
    } else if (interval == 'm') {
        return [];
    } else if (interval == 'y') {
        return [];
    } else {
        throw new Error("Invalid interval for queryDb.");
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