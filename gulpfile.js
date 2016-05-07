'use strict';

var gulp = require('gulp');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');
var sass = require('gulp-sass');
var browserify = require('browserify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var tsify = require('tsify');
var through = require('through2');
var globby = require('globby');
var gulp = require('gulp');
var mainBowerFiles = require('gulp-main-bower-files');

gulp.task('scripts', ['typescript'], function () {
    // gulp expects tasks to return a stream, so we create one here.
    var bundledStream = through();

    bundledStream
    // turns the output bundle stream into a stream containing
    // the normal attributes gulp plugins expect.
        .pipe(source('bundle.js'))
    // the rest of the gulp task, as you would normally write it.
    // here we're copying from the Browserify + Uglify2 recipe.
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
    // Add gulp plugins to the pipeline here.
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./scripts'));

    // "globby" replaces the normal "gulp.src" as Browserify
    // creates it's own readable stream.
    globby(['./scripts/js/*.js']).then(function (entries) {
        // create the Browserify instance.
        var b = browserify({
            entries: entries,
            debug: true
        });

        // pipe the Browserify stream into the stream we created earlier
        // this starts our gulp pipeline.
        b.bundle().pipe(bundledStream);
    }).catch(function (err) {
        // ensure any errors from globby are handled
        bundledStream.emit('error', err);
    });

    // finally, we return the stream, so gulp knows when this task is done.
    return bundledStream;
});


gulp.task('sass', function () {
    return gulp.src('./sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./styles'));
});


gulp.task('typescript', function () {
    var tsResult = tsProject.src().pipe(ts(tsProject));
    return tsResult.js
        .pipe(gulp.dest('scripts/js'));
});

gulp.task('watch', ['scripts', 'sass'], function () {
        gulp.watch('./src/**/*.ts', ['scripts']);
        gulp.watch('./sass/**/*.scss', ['sass']);
    });

gulp.task('default', ['scripts', 'sass']);
 
gulp.task("bower-files", function(){
    gulpBowerFiles().pipe(gulp.dest("./scripts"));
});

var gulp = require('gulp');
var mainBowerFiles = require('gulp-main-bower-files');

gulp.task('main-bower-files', function() {
    return gulp.src('./bower.json')
        .pipe(mainBowerFiles())
        .pipe(gulp.dest('./scripts'));
});