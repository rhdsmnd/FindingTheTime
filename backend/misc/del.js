var rimraf = require('rimraf');

if (process.argv.length == 3) {
    rimraf(process.argv[2], {}, function (err) {
        if (err) {
            console.log(err);
        }
    });
}