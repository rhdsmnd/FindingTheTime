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


describe('Routes', function() {
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

        this.timeout(10000);
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


    /**
    describe('Sanity test', function() {
        it('should pass', function() {
            this.timeout(10000);

            let asyncProm = new Promise(function(resolve, reject) {
                resolve("foo");
            });

            return asyncProm.should.eventually.equal("foo");
        });
    });
     */

    describe('GET /query', function(done) {
        it("should return JSON of session data.", function(done) {

            clearSessions(db);

            db.run(`INSERT INTO sessions(start_ts, end_ts, descr, prim_type_id, second_type_id) VALUES
                    (
                        1457251200,
                        1457251500,
                        "",
                        (SELECT prim_type.id FROM prim_type WHERE prim_type.name="coding"),
                        (SELECT second_type.id FROM second_type WHERE second_type.name="web server")
                    );
            `);

            chai.request("http://localhost:2999")
                .get("/query?interval=d&date=1457251200")
                .end(function(err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.length == 1).to.be.true;
                    done();
                });
        });
    });

    describe('PUT /sessions', function(done) {
        it("should put a session into the database.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });

});

function clearSessions(dbConnection) {
    dbConnection.run("DELETE FROM sessions");
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
