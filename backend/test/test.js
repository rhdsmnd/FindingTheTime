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

console.log(__dirname);

// run from 'npm test', so current directory is backend root
const DB_PATH = "./test_db/test_db.sqlite3";
var db;


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
        server = app.start(DB_PATH, done);
    }, function(err) {
        console.log("Error opening database");
        done(err);
    });
});

after(function(done) {
    //stop server
    server.close();

    // delete database
    db.close(function(err) {
        if (!err) {
            console.log("exiting");
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
        var primTypeIds = {};
        var secondTypeIds = {};
        before(function(done) {

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

            Promise.all([primTypeQuery, secTypeQuery]).then(function(dataArr) {
                done();
            });

        });

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

        // TODO: MORE TESTS REGARDING THE ACTIVE SESSION
    });
/**
    describe('DEL /sessions', function(done) {
        it("should delete a session from the database.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });

    describe('PUT /prim_type', function(done) {
        it("should put a primary type into the database.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });

    describe('DEL /prim_type', function(done) {
        it("should delete a primary type from the database.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });

    describe('PUT /sec_type', function(done) {
        it("should put a secondary type into the database.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });

    describe('DEL /sec_type', function(done) {
        it("should delete a secondary type from the database.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });

    describe('PUT /color', function(done) {
        it("should put a secondary type into the database.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });

    describe('DEL /color', function(done) {
        it("should delete a secondary type from the database.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });
*/
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
