import app from "../transpiled/bundle_app";

function listenCb() {
    console.log("Web server started.");
}
if (process.argv.length == 3) {
    module.exports = app.start(process.argv[2], listenCb);
} else {
    module.exports = app.start("", listenCb);
}
