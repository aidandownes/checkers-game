var gulp = require('gulp');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');
var sass = require('gulp-sass');
 
gulp.task('sass', function () {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./styles'));
});
 
gulp.task('scripts', function () {
    var tsResult = tsProject.src().pipe(ts(tsProject));
	return tsResult.js.pipe(gulp.dest('scripts'));
});

gulp.task('default', ['scripts', 'sass']);
