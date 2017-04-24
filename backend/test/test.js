var app = require('../transpiled/app');

var server;

var sqlite3 = require('sqlite3');

var fs = require('fs');
var childProc = require('child_process');


var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var chaiHttp = require('chai-http');
chai.use(chaiAsPromised);
chai.use(chaiHttp);
chai.should();

/**
var assert = require('assert');
 */
var expect = require('chai').expect;

const SERVER_START_MESSAGE = "Web server started.";

// run from 'npm test', so current directory is backend root
const DB_PATH = "./test_db/test_db.sqlite3";
var db;


var primTypeIds = {};
var secondTypeIds = {};

before(function(done) {

    // set up database
    new Promise(function(resolve, reject) {

        db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function(err) {
            if (err) {
                throw new Error("Couldn't create test database.");
            }
            resolve();
        });

    }).then(function() {
        server = app.start(DB_PATH, function(data) {
            Promise.all([primTypeQuery, secTypeQuery]).then(function(dataArr) {
                done();
            });
        });
    }, function(err) {
        console.log("Error opening database");
        done(err);
    });

    var primTypeQuery = new Promise(function (resolve, reject) {
        db.all("SELECT prim_type.id, prim_type.name FROM prim_type", {}, function (err, rows) {
            if (err) {
                console.log(err);
                reject("Error retrieving primary types from database.");
            }
            rows.forEach(function (elem) {
                primTypeIds[elem["name"]] = elem["id"];
            });

            resolve();
        });
    });
    var secTypeQuery = new Promise(function (resolve, reject) {
        db.all("SELECT second_type.id, second_type.name FROM second_type", {}, function(err, rows) {
            if (err) {
                console.log(err);
                reject("Error retrieving secondary types from database.");
            }
            rows.forEach(function(elem) {
                secondTypeIds[elem["name"]] = elem["id"];
            });

            resolve();
        });
    });

});

after(function(done) {
    //stop server
    server.close();

    // delete database
    db.close(function(err) {
        if (!err) {
            done();
        } else {
            console.log(err);
            throw new Error("Couldn't close database connection.");
        }
    });
});

beforeEach(function(done) {
    clearSessions(db, function() {
        done();
    });
});

afterEach(function() {

});

describe('Routes', function() {

    describe('Sanity test', function() {
        it('should pass', function() {

            let asyncProm = new Promise(function(resolve, reject) {
                resolve("foo");
            });

            return asyncProm.should.eventually.equal("foo");
        });
    });

    describe('GET /query', function() {

        it("should return JSON of session data.", function(done) {

            db.run(`INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id, second_type_id) VALUES
                    (
                        1487660460,
                        1487660560,
                        "",
                        (SELECT prim_type.id FROM prim_type WHERE prim_type.name="coding"),
                        (SELECT second_type.id FROM second_type WHERE second_type.name="web server")
                    );
            `);

            chai.request("http://localhost:2999")
                .get("/query?interval=d&date=1487660160")
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.length).to.equal(1);
                    let respSession = res.body[0];

                    expect(respSession["prim_name"]).to.equal("coding");
                    expect(respSession["sec_name"]).to.equal("web server");
                    expect(parseInt(respSession["start_ts"])).to.equal(1487660460);
                    expect(parseInt(respSession["end_ts"])).to.equal(1487660560);
                    expect(parseInt(respSession["prim_r"])).to.equal(179);
                    expect(parseInt(respSession["sec_r"])).to.equal(59);

                    done();
            });
        });

        it('should return an empty array', function(done) {
            chai.request("http://localhost:2999")
                .get("/query?interval=d&date=1457252200")
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.length).to.equal(0);
                    done();
            });
        });

        it('should return multiple sessions between 12am and 12pm Pacific time.', function(done) {

            db.run(`INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id, second_type_id) VALUES
                    (
                        1487660460,
                        1487660660,
                        "",
                        (SELECT prim_type.id FROM prim_type WHERE prim_type.name="hobbies"),
                        (SELECT second_type.id FROM second_type WHERE second_type.name="writing")
                    );
            `);

            db.run(`INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id, second_type_id) VALUES
                    (
                        1487640330,
                        1487645330,
                        "",
                        (SELECT prim_type.id FROM prim_type WHERE prim_type.name="exercise"),
                        (SELECT second_type.id FROM second_type WHERE second_type.name="tempo run")
                    );
            `);

            chai.request("http://localhost:2999")
                .get("/query?interval=d&date=1487638800")
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.length).to.equal(2);
                    done();
            });
        });

        it("should return bad request (HTTP status code 400).", function(done) {
            var noParams = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .get("/query")
                    .end(function(err, res) {
                        expect(res).to.have.status(400);
                        resolve();
                    });
            });

            var invalidInterval = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .get("/query?interval=sfs&date=1487638800")
                    .end(function(err, res) {
                        expect(res).to.have.status(400);
                        resolve();
                    });
            });

            var invalidDate = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .get("/query?interval=d&date=asdf")
                    .end(function(err, res) {
                        expect(res).to.have.status(400);
                        resolve();
                    });
            });

            var invalidParameters = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .get("/query?interval=ddate=148763800")
                    .end(function(err, res) {
                        expect(res).to.have.status(400);
                        resolve();
                    });
            });

            Promise.all([noParams, invalidInterval, invalidDate, invalidParameters]).then(function(data) {
                done();
            });

        });
    });

    describe('PUT /sessions', function() {

        beforeEach(function(done) {
            db.run(`INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id, second_type_id) VALUES
                        (1487660460, 1487668860, "Th",
                            ${primTypeIds["coding"]}, ${secondTypeIds["database"]})
            `, undefined, function(err) {
                done();
            });
        });

        it("should put a session into the database.", function(done) {

            chai.request("http://localhost:2999")
                .put("/sessions")
                .send({
                    "start_ts": "1487660060",
                    "end_ts": "1487660260",
                    "descr": "Th",
                    "prim_type_id": primTypeIds["coding"],
                    "sec_type_id": secondTypeIds["web server"]
                })
                .end(function(err, res) {
                    if (err) {
                        console.log(res.text);
                    }
                    expect(res).to.have.status(200);
                    var newSession = db.get("SELECT sessions.start_ts, sessions.end_ts, sessions.descr, sessions.prim_type_id, sessions.second_type_id AS sec_type_id FROM sessions WHERE sessions.start_ts = 1487660060;",
                                                undefined, function(err, row) {
                        if (err) {
                            console.log(err);
                            throw new Error("Error querying database.");
                        }
                        expect(row["start_ts"]).to.equal(1487660060);
                        expect(row["end_ts"]).to.equal(1487660260);
                        expect(row["descr"]).to.equal("Th");
                        expect(row["prim_type_id"]).to.equal(primTypeIds["coding"]);
                        expect(row["sec_type_id"]).to.equal(secondTypeIds["web server"]);
                        done();
                    });
            });
        });

        it("should not save sessions with equal start timestamps.", function(done) {
            // beforeEach loads a session into the database
            chai.request("http://localhost:2999")
                .put("/sessions")
                .send({
                    "start_ts": "1487660460",
                    "end_ts": "1487668860",
                    "descr": '"Th"',
                    "prim_type_id": primTypeIds["coding"],
                    "sec_type_id": secondTypeIds["web server"]
                })
                .end(function(err, res) {
                    if (res.status != 400 && err) {
                        console.log(err);
                        throw new Error("Error making PUT request to server.");
                    }
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it("should not save sessions that conflict with existing sessions.", function(done) {
            // beforeEach loads a session into the database
            let endTsBetween = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .put("/sessions")
                    .send({
                        "start_ts": "1487660060",
                        "end_ts": "1487668560",
                        "descr": "Th",
                        "prim_type_id": primTypeIds["coding"],
                        "sec_type_id": secondTypeIds["web server"]
                    })
                    .end(function(err, res) {
                        if (res.status != 400 && err) {
                            console.log(err);
                            throw new Error("Error making PUT request to server.");
                        }
                        expect(res).to.have.status(400);
                        resolve();
                    });
            });

            let startTsBetween = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .put("/sessions")
                    .send({
                        "start_ts": "1487660560",
                        "end_ts": "1487668960",
                        "descr": 'Th',
                        "prim_type_id": primTypeIds["coding"],
                        "sec_type_id": secondTypeIds["web server"]
                    })
                    .end(function(err, res) {
                        if (res.status != 400 && err) {
                            console.log(err);
                            throw new Error("Error making PUT request to server.");
                        }
                        expect(res).to.have.status(400);
                        resolve();
                    });
            });

            let sessionInBetween = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .put("/sessions")
                    .send({
                        "start_ts": "1487660490",
                        "end_ts": "1487668800",
                        "descr": 'Th',
                        "prim_type_id": primTypeIds["coding"],
                        "sec_type_id": secondTypeIds["web server"]
                    })
                    .end(function(err, res) {
                        if (res.status != 400 && err) {
                            console.log(err);
                            throw new Error("Error making PUT request to server.");
                        }
                        expect(res).to.have.status(400);
                        resolve();
                    });
            });

            let sessionEncloses = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .put("/sessions")
                    .send({
                        "start_ts": "1487660400",
                        "end_ts": "1487668900",
                        "descr": 'Th',
                        "prim_type_id": primTypeIds["coding"],
                        "sec_type_id": secondTypeIds["web server"]
                    })
                    .end(function(err, res) {
                        if (res.status != 400 && err) {
                            console.log(err);
                            throw new Error("Error making PUT request to server.");
                        }
                        expect(res).to.have.status(400);
                        resolve();
                    });
            });

            Promise.all([startTsBetween, endTsBetween, sessionEncloses, sessionInBetween]).then(function(values) {
                done();
            });

        });

        it("should not save a session that is missing a start timestamp or primary type id.", function(done) {
            let missingStart = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .put("/sessions")
                    .send({
                        "descr" : "asdf",
                        "prim_type_id" : primTypeIds["coding"],
                        "sec_type_id" : secondTypeIds["web server"]
                    }).end(function(err, res) {
                        if (res.status != 400 && err) {
                            console.log(err);
                            throw new Error("Error making PUT request to server.");
                        }
                        expect(res).to.have.status(400);
                        resolve();
                });
            });
            let missingPrimId = new Promise(function(resolve, reject) {
                chai.request("http://localhost:2999")
                    .put("/sessions")
                    .send({
                        "start_ts": "1487660400",
                        "end_ts": "1487668900",
                        "descr": 'Th'
                    }).end(function(err, res) {
                    if (res.status != 400 && err) {
                        console.log(err);
                        throw new Error("Error making PUT request to server.");
                    }
                    expect(res).to.have.status(400);
                    resolve();
                });
            });

            Promise.all([missingStart, missingPrimId]).then(function(values) { done(); });
        });

        it("should save a session that is missing optional fields (any field that is not start timestamp or primary type id.", function(done) {
            chai.request("http://localhost:2999")
                .put("/sessions")
                .send({
                    "start_ts": "1487668970",
                    "prim_type_id": primTypeIds["coding"]
                })
                .end(function(err, res) {
                    if (err) {
                        console.log(res.text);
                    }
                    expect(res).to.have.status(200);
                    var newSession = db.get("SELECT sessions.start_ts, sessions.prim_type_id FROM sessions WHERE sessions.start_ts = 1487668970;",
                        undefined, function(err, row) {
                            if (err) {
                                console.log(err);
                                throw new Error("Error querying database.");
                            }
                            expect(row["start_ts"]).to.equal(1487668970);
                            expect(row["prim_type_id"]).to.equal(primTypeIds["coding"]);
                            done();
                        });
                });
        });

        it("Should not save an active session if there is an existing active session", function(done) {
            db.run("INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id) "
                        + "VALUES (487660400, null, \"asdf\", " + primTypeIds["coding"] + ");", {}, function(err) {
                chai.request("http://localhost:2999")
                    .put("/sessions")
                    .send({
                        "start_ts": "1487668970",
                        "prim_type_id": primTypeIds["coding"]
                    })
                    .end(function(err, res) {
                        expect(res).to.have.status(400);
                        done();
                    });
            });
        });

        it("Should not save an active session if it conflicts with an existing session", function(done) {
            db.run("INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id) "
                + "VALUES (487660400, 487660600, \"asdf\", " + primTypeIds["coding"] + ");", {}, function(err) {
                chai.request("http://localhost:2999")
                    .put("/sessions")
                    .send({
                        "start_ts": "1487660300",
                        "prim_type_id": primTypeIds["coding"]
                    })
                    .end(function(err, res) {
                        expect(res).to.have.status(400);
                        done();
                    });
            });
        });

        it("Should not save a session with a timestamp in the future.", function(done) {
            chai.request("http://localhost:2999")
                .put("/sessions")
                .send({
                    "start_ts": "1487660300",
                    "prim_type_id": primTypeIds["coding"]
                })
                .end(function(err, res) {
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it("Should not save a session with a start timestamp greater than the end timestamp", function(done) {
            chai.request("http://localhost:2999")
                .put("/sessions")
                .send({
                    "start_ts": "1487660360",
                    "end_ts": "1487660260",
                    "descr": "Th",
                    "prim_type_id": primTypeIds["coding"],
                    "sec_type_id": secondTypeIds["web server"]
                })
                .end(function(err, res) {
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it("Should not save a session with an invalid primary type id", function(done) {
            chai.request("http://localhost:2999")
                .put("/sessions")
                .send({
                    "start_ts": "1487660060",
                    "end_ts": "1487660260",
                    "descr": "Th",
                    "prim_type_id": 1000,
                    "sec_type_id": secondTypeIds["web server"]
                })
                .end(function(err, res) {
                    expect(res).to.have.status(400);
                    done();
                });
        });

        it("Should not save a session with an invalid secondary type id", function(done) {
            chai.request("http://localhost:2999")
                .put("/sessions")
                .send({
                    "start_ts": "1487660060",
                    "end_ts": "1487660260",
                    "descr": "Th",
                    "prim_type_id": primTypeIds["coding"],
                    "sec_type_id": 1000
                })
                .end(function(err, res) {
                    expect(res).to.have.status(400);
                    done();
                });
        });

    });

    describe('DEL /sessions', function() {
        let sessionId;

        beforeEach(function(done) {
            db.run(`INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id) VALUES
                        (1487660460, 1487668860, "Th",
                            (SELECT prim_type.id FROM prim_type WHERE prim_type.name = \"coding\"));
            `, undefined, function(err) {
                db.get(`SELECT sessions.id FROM sessions WHERE sessions.start_ts = 1487660460`, {}, function(err, row) {
                    sessionId = row["id"];
                    done();
                });
            });
        });

        it("should delete a session from the database (given id in request body).", function(done) {
            chai.request("http://localhost:2999")
                .delete("/sessions")
                .send({
                    "id" : sessionId
                })
                .end(function(err, res) {
                   expect(res).to.have.status(200);
                   db.get(`SELECT sessions.id FROM sessions WHERE sessions.id = ${sessionId}`, {}, function(err, row) {
                       expect(row).to.equal(undefined);
                       done();
                   })
                });
        });

        it("should delete a session from the database (given start timestamp in request body).", function(done) {
            chai.request("http://localhost:2999")
                .delete("/sessions")
                .send({
                    "start_ts" : 1487660460
                })
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    db.get(`SELECT sessions.id FROM sessions WHERE sessions.id = ${sessionId}`, {}, function(err, row) {
                        expect(row).to.equal(undefined);
                        done();
                    })
                });
        });
    });


    describe('GET /prim_type', function() {
        it("should return a primary type.", function(done) {
            chai.request("http://localhost:2999")
                .get("/primary_type?name=coding")
                .send({
                    "name" : "coding"
                })
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(JSON.parse(res.text)["name"]).to.equal("coding");
                    done();
                });
        });

        it("should return all primary types.", function(done) {
            chai.request("http://localhost:2999")
                .get("/primary_type")
                .send()
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(JSON.parse(res.text).length).to.equal(4);
                    done();
                });
        });
    });

    describe('PUT /prim_type', function() {
        it("should put a primary type into the database.", function(done) {

            chai.request("http://localhost:2999")
                .put("/primary_type")
                .send({
                    "name" : "asdf",
                    "r" : 179,
                    "g" : 161,
                    "b" : 131
                })
                .end(function(err, res) {
                   expect(res).to.have.status(200);
                   db.get(`SELECT prim_type.name FROM prim_type WHERE prim_type.name = "asdf";`, {}, function(err, row) {
                       expect(row["name"]).to.equal("asdf");
                       done();
                   })
                });
        });
    });

    describe('DEL /prim_type', function() {
        before(function(done) {
           db.run("INSERT INTO prim_type(name, r, g, b) VALUES (\"asdfff\", 179, 161, 131);", {}, function(err) {
               if (!err) {
                   done();
               } else {
                   console.log(err.message);
                   throw new Error("Couldn't insert primary type into database for testing.");
               }
           });
        });

        it("should delete a primary type from the database.", function(done) {

            chai.request("http://localhost:2999")
                .delete("/primary_type")
                .send({
                    "name" : "asdfff"
                })
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    db.get("SELECT prim_type.name FROM prim_type WHERE prim_type.name=\"asdfff\";", {}, function(err, row) {
                        expect(row).to.equal(undefined);
                        done();
                    });
                });

        });
    });

    describe('GET /sec_type', function() {
        it('should get a secondary type from the database.', function(done) {
            chai.request("http://localhost:2999")
                .get("/secondary_type")
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(JSON.parse(res.text).length).to.equal(8);
                    done();
            });
        });

        it('should get all secondary types from the database.', function(done) {
            chai.request("http://localhost:2999")
                .get("/secondary_type?primName=coding&name=web server")
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(JSON.parse(res.text)["name"]).to.equal("web server");
                    done();
                })
        });
    });

    describe('PUT /sec_type', function() {
        it("should put a secondary type into the database.", function(done) {
            chai.request("http://localhost:2999")
                .put("/secondary_type")
                .send({
                    "prim_type_name" : "coding",
                    "name" : "testing",
                    "r" : 179,
                    "g" : 161,
                    "b" : 131
                })
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    db.get("SELECT second_type.name FROM second_type WHERE second_type.name = \"testing\";", {}, function(err, row) {
                        expect(row["name"]).to.equal("testing");
                        done();
                    });
                });
        });
    });

    describe('DEL /sec_type', function() {
        it("should delete a secondary type from the database.", function(done) {
            new Promise(function(resolve, reject) {
                db.get(`SELECT prim_type.id FROM prim_type WHERE prim_type.name="coding";`,
                                    {}, function(err, row) {
                    if (err) {
                        console.log(err.message);
                        throw new Error("Database error retrieving primary type id for secondary type test.");
                    } else if (!row){
                        throw new Error("No entry for \"coding\" primary type.");
                    } else {
                        resolve(row["id"]);
                    }
                });
            }).then(function(primTypeId) {
                chai.request("http://localhost:2999")
                    .delete("/secondary_type")
                    .send({
                        prim_name : "coding",
                        name : "database"
                    })
                    .end(function(err, res) {
                        db.get(`SELECT second_type.name FROM second_type
                                    WHERE second_type.prim_type_id = ${primTypeId}
                                        AND second_type.name="database"`,
                                {}, function(err, row) {
                            if (err) {
                                console.log(err.message);
                                throw new Error("Database error retrieving secondary type.");
                            } else {
                                expect(row).to.equal(undefined);
                                done();
                            }
                        });
                    });
            });
        });
    });

    describe('GET /color', function() {
       it("should get all colors in the database.", function(done) {
           chai.request("http://localhost:2999")
               .get("/colors")
               .end(function(err, res) {
                   expect(res).to.have.status(200);
                   expect(JSON.parse(res.text).length).to.equal(22);
                   done();
               })
       })
    });

    describe('PUT /color', function() {
        it("should put a color into the database.", function(done) {
            chai.request("http://localhost:2999")
                .put("/colors")
                .send({
                    'r' : 100,
                    'g' : 100,
                    'b' : 100
                })
                .end(function(err, res) {
                   expect(res).to.have.status(200);
                   db.get(`SELECT * FROM colors WHERE
                                colors.r=100
                            AND colors.g=100
                            AND colors.b=100
                    `, {}, function(err, row) {
                        if (err) {
                            console.log(err.message);
                            throw new Error("Database error retrieving color.");
                        } else {
                            if (row) {
                                expect(row["r"]).to.equal(100);
                                done();
                            } else {
                                throw new Error("Request did not save color into database.");
                            }
                        }
                   });
                });
        });
    });

    describe('DEL /color', function() {
        it("should delete a color from the database.", function(done) {
            db.run(`INSERT INTO colors(r, g, b) VALUES (123, 124, 125);`, {}, function(err) {
                if (err) {
                    console.log(err.message);
                    throw new Error("Couldn't insert a record into the colors table.");
                } else {
                    chai.request("http://localhost:2999")
                        .delete("/colors")
                        .send({ 'r' : 123,
                                'g' : 124,
                                'b' : 125
                        })
                        .end(function(err, res) {
                            if (err) {
                                console.log(err);
                                throw new Error("Error receiving response from server");
                            } else {
                                expect(res).to.have.status(200);
                                db.get(`SELECT * FROM colors WHERE
                                                colors.r = 123
                                            AND colors.g = 124
                                            and colors.b = 125`, {}, function(err, row) {
                                    if (err) {
                                        console.log(err.message);
                                        throw new Error("Couldn't query database for color.");
                                    } else {
                                        expect(row).to.equal(undefined);
                                        done();
                                    }
                                });
                            }
                        });
                }
            });

        });
    });

});

function clearSessions(dbConnection, cb) {
    dbConnection.run("DELETE FROM sessions", undefined, cb);
}

function loadColors() {
    db.run('INSERT INTO colors(r, g, b) VALUES (179,161,131)');
    db.run('INSERT INTO colors(r, g, b) VALUES (174,142,94)');
    db.run('INSERT INTO colors(r, g, b) VALUES (80,57,49)');
    db.run('INSERT INTO colors(r, g, b) VALUES (180,176,173)');
    db.run('INSERT INTO colors(r, g, b) VALUES (185,187,226)');
    db.run('INSERT INTO colors(r, g, b) VALUES (59,40,96)');
    db.run('INSERT INTO colors(r, g, b) VALUES (33,64,95)');
    db.run('INSERT INTO colors(r, g, b) VALUES (107,143,221)');

}
