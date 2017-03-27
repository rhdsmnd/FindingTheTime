
// scrap by with npm & mocha for now

var gulp = require('gulp');
var babel = require('gulp-babel');
var rename = require('gulp-rename');
var webpack = require('webpack-stream');
var childProc = require('child_process');
var fs = require('fs');

gulp.task('build', function() {
    gulp.src("src/*.js")
        .pipe(babel({"presets": [["env", {"targets": {"node" : "current"}}]]}))
        .pipe(gulp.dest('transpiled'));
});

