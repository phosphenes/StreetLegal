const { src, dest, watch, parallel } = require('gulp')
const sass = require('gulp-sass')
const replace = require('gulp-replace')
const concat = require('gulp-concat')
const sourcemaps = require('gulp-sourcemaps')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

// constants
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const CSS_PATH = '/styles.css'
const SASS_PATH = '/styles.sass'
const PUBLIC_DEST = `/`

// build tasks
const postcssTask = [autoprefixer()].concat(IS_PRODUCTION ? [cssnano()] : [])
const replaceStatic = () => replace('url(../static/img', 'url(img')

const cssTask = _cb =>
	src(CSS_PATH)
		.pipe(postcss(postcssTask))
		.pipe(dest(PUBLIC_DEST))
const sassBuildTask = _cb =>
	src(SASS_PATH)
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss(postcssTask))
		.pipe(dest(PUBLIC_DEST))

// watch tasks
const basicWatch = (path, task) => _cb =>
	watch(path, { ignoreInitial: false }, task)

const watchCSS = basicWatch(CSS_PATH, _cb =>
	src(CSS_PATH).pipe(postcss(postcssTask)).pipe(dest(PUBLIC_DEST))
)
const watchSASS = basicWatch(SASS_PATH, _cb =>
	src(SASS_PATH)
		.pipe(replaceStatic())
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(concat('main.css'))
		.pipe(postcss(postcssTask))
		.pipe(sourcemaps.write('./'))
		.pipe(dest(PUBLIC_DEST))
)

exports.build = parallel(
	cssTask,
	sassBuildTask,
)
exports.watch = parallel(
	watchCSS,
	watchSASS,
)
exports.default = exports.build