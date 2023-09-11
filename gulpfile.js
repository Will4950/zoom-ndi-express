import 'dotenv/config';
import gulp from 'gulp';
import cache from 'gulp-cache';
import cleanCSS from 'gulp-clean-css';
import concat from 'gulp-concat';
import eslint from 'gulp-eslint-new';
import nodemon from 'gulp-nodemon';
import uglify from 'gulp-uglify';
import streamqueue from 'streamqueue';
import {deleteSync} from 'del';
import log from 'fancy-log';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import cp from 'node:child_process';
const sass = gulpSass(dartSass);

const STREAMS = 12;

function runCommand(command) {
	return new Promise((resolve) => {
		cp.exec(
			command,
			{
				encoding: 'utf8'
			},
			(error, stdout) => {
				log(`${stdout}`);
				resolve(stdout);
			}
		);
	});
}

function start_camera_stream(num) {
	const nvidia = process.env.NVIDIA;
	log(
		`Starting feed: ${num} ${nvidia === 'true' ? 'nvdec_enabled' : ''} ${
			process.env.USE_HQ_VIDEOS === 'true' ? 'hq_source' : ''
		}`
	);
	if (num === STREAMS) log('Running demo camera feeds. Press ctrl+c to stop.');
	return runCommand(
		`ffmpeg ${
			nvidia === 'true' ? '-hwaccel nvdec' : ''
		} -hide_banner -loglevel error -nostats -stream_loop -1 -re -i ./vids/video${num}.flv -acodec copy -vcodec copy -f flv rtmp://${
			process.env.HOST
		}:1935/live/camera${num}`
	);
}

export const start_nginx = () => {
	return runCommand(`docker compose up --build nginx -d --remove-orphans`);
};

export const stop_nginx = () => {
	return runCommand('docker compose down');
};

const clean = (done) => {
	deleteSync(['dist']);
	return done();
};

const lint_src = () => {
	return gulp
		.src(['src/**/*.js', 'index.js'])
		.pipe(eslint())
		.pipe(eslint.format());
};

const build_client = () => {
	deleteSync(['dist/js/*.js']);
	return gulp
		.src(['client/js/*.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(cache(uglify()))
		.pipe(gulp.dest('dist/js'));
};

const build_css = () => {
	deleteSync(`dist/css/*`);
	deleteSync(`dist/css/files/*/`);
	gulp
		.src([
			'node_modules/@fontsource/lato/files/lato-latin-ext-400-normal.woff2',
			'node_modules/@fontsource/lato/files/lato-latin-400-normal.woff2',
			'node_modules/@fortawesome/fontawesome-free/webfonts/*.woff2'
		])
		.pipe(gulp.dest(`dist/css/files`));
	return gulp
		.src('client/scss/*.scss')
		.pipe(sass({quietDeps: true}))
		.pipe(cache(cleanCSS({level: {1: {specialComments: 0}}})))
		.pipe(gulp.dest(`dist/css`));
};

const build_vendor = () => {
	deleteSync(['dist/shared/vendor.js']);
	return gulp
		.src([
			'node_modules/socket.io-client/dist/socket.io.min.js',
			'node_modules/jquery/dist/jquery.min.js',
			'node_modules/jquery-backstretch/jquery.backstretch.min.js',
			'node_modules/@popperjs/core/dist/umd/popper.min.js',
			'node_modules/bootstrap/dist/js/bootstrap.min.js'
		])
		.pipe(cache(uglify()))
		.pipe(concat('vendor.js'))
		.pipe(gulp.dest('dist/shared'));
};

const build_clappr = () => {
	deleteSync(['dist/shared/clappr.js']);
	gulp
		.src([
			'node_modules/clappr/dist/*.swf',
			'node_modules/clappr/dist/*.ttf',
			'node_modules/clappr/dist/*.cur'
		])
		.pipe(gulp.dest('dist/shared'));
	return streamqueue(
		{objectMode: true},
		gulp.src(['node_modules/clappr/dist/clappr.min.js']).pipe(cache(uglify())),
		gulp
			.src(['client/vendor/clappr.js'])
			.pipe(eslint())
			.pipe(eslint.format())
			.pipe(cache(uglify()))
	)
		.pipe(concat('clappr.js'))
		.pipe(gulp.dest('dist/shared'));
};

const build_zoom = () => {
	deleteSync(['dist/shared/zoom.js']);
	deleteSync(['dist/lib']);
	gulp
		.src(['node_modules/@zoomus/websdk/dist/lib/**/*'])
		.pipe(gulp.dest('dist/lib'));
	return streamqueue(
		{objectMode: true},
		gulp
			.src([
				'node_modules/react/umd/react.production.min.js',
				'node_modules/react-dom/umd/react-dom.production.min.js',
				'node_modules/@zoomus/websdk/dist/zoom-meeting-embedded-ES5.min.js'
			])
			.pipe(cache(uglify())),
		gulp
			.src(['client/vendor/zoom.js'])
			.pipe(eslint())
			.pipe(eslint.format())
			.pipe(cache(uglify()))
	)
		.pipe(concat('zoom.js'))
		.pipe(gulp.dest('dist/shared'));
};

const watch_client = async () => {
	gulp.watch(['client/js/**/*.js'], gulp.series(build_client));
	gulp.watch(['client/scss/**/*.scss'], gulp.series(build_css));
	gulp.watch(['client/vendor/clappr.js'], gulp.series(build_clappr));
	gulp.watch(['client/vendor/zoom.js'], gulp.series(build_zoom));
};

const watch_src = async () => {
	gulp.watch(['src/**/*.js', 'index.js'], gulp.series(lint_src));
};

const watch_dev = async (done) => {
	let stream = nodemon({
		script: './index.js',
		ext: 'js',
		watch: ['src/', 'index.js'],
		env: {
			NODE_ENV: 'development',
			version: process.env.npm_package_version,
			DEBUG: true
		},
		done: done()
	});

	stream.on('crash', function () {
		stream.emit('restart', 30);
	});
};

export const feeds = async (done) => {
	for (let i = 1; i <= STREAMS - 1; i++) {
		start_camera_stream(i);
	}
	await start_camera_stream(STREAMS);
	done();
};

export const dev = gulp.series(
	gulp.parallel(watch_client, watch_src, watch_dev)
);

export const build = gulp.series(
	clean,
	build_client,
	build_css,
	build_vendor,
	build_clappr,
	build_zoom
);
