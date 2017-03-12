import express from 'express';
import bodyParser from 'body-parser';

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

var validator = function(req, res, next) {
    next();
}

var routes = {
    ses : "/sessions",
    col : "/colors",
    pri : "/primary_type",
    sec : "/secondary_type"
}

app.use(bodyParser.json());

app.use(validator);

app.post(routes["ses"], function(req, res) {
    res.send("Not implemented");
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

function isValidUpdate(req) {

}

function isValidCreate(req) {

}

function queryDb(interval, start_ts, end_ts, cb) {
    if (interval == "d") {
        let end_ts = moment(ts).add(1, 'day')
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



