var app = require('../transpiled/app');

var server;

var sqlite3 = require('sqlite3');

var fs = require('fs');
var childProc = require('child_process');


var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var chaiHttp = require('chai-http');
chai.use(chaiAsPromised);
chai.should();

/**
var assert = require('assert');
var expect = require('chai').expect;
*/

const SERVER_START_MESSAGE = "Web server started.";

console.log(__dirname);

// run from 'npm test', so current directory is backend root
const DB_PATH = "./test_db_data/test_db.sqlite3";


describe('Routes', function() {
    var db;
    before(function(done) {

        // set up database
        new Promise(function(resolve, reject) {
            console.log("Running promise");

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


    describe('Sanity test', function() {
        it('should pass', function() {
            this.timeout(10000);

            let asyncProm = new Promise(function(resolve, reject) {
                resolve("foo");
            });

            return asyncProm.should.eventually.equal("foo");
        });
    });

    describe('GET /query', function() {
        it("should return JSON of session data.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });

    describe('PUT /sessions', function(done) {
        it("should put a session into the database.", function() {

            // NOT IMPLEMENTED
            return Promise.resolve(1).should.eventually.equal(1);
        });
    });

});