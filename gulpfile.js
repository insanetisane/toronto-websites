// PLUGINS
// ---------

var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var path = require('path');

var Metalsmith = require('metalsmith');
var watch = require('metalsmith-watch');
// styles:
var less = require('metalsmith-less');
var autoprefixer = require('metalsmith-autoprefixer');
var cleanCSS = require('metalsmith-clean-css');
// templates:
var templates = require('metalsmith-templates');
var jade = require('jade');
var markdown = require('metalsmith-markdown');
var collections = require('metalsmith-collections');
var branch = require('metalsmith-branch');
var permalinks = require('metalsmith-permalinks');
var each = require('metalsmith-each');
// scripts:
var uglify = require('metalsmith-uglify');
// development:
var browserSync = require("browser-sync").create();

// VARIABLES
// ---------
var paths = {
	src: './src',
	templates: './templates',
	build: './build/'
}

// var ENV = 'prod';
var ENV = process.env.NODE_ENV;
console.log(ENV);

// FUNCTIONS
// ---------

var siteData = function(files, metalsmith, done) {
    var metadata = metalsmith.metadata();
    var site = require('./site.json');
    metadata.site = site;
    done();
};

function removeRenderless(){
    return function(files, metalsmith, done){
        setImmediate(done);
        Object.keys(files).forEach(function(file){
            var data = files[file];
            if (data._render == false) delete files[file];
        });
    };
}

var findTemplate = function(config) {
    var pattern = new RegExp(config.pattern);

    return function(files, metalsmith, done) {
        for (var file in files) {
            if (pattern.test(file)) {
                var _f = files[file];
                if (!_f.template) {
                    _f.template = config.templateName;
                }
            }
        }
        done();
    };
};

// TASKS
// -----

// METALSMITH

gulp.task('build', function(cb) {
    var metalsmith = Metalsmith(__dirname);

    if (ENV !== 'prod') {
        metalsmith
        .use(watch({
            paths: {
                '${source}/**/content/**/*': "**/content/**/*",
                '${source}/**/*.js': true,
                '${source}/**/*.{css,less,sass,scss}': true,
                'templates/**/*': "**/content/**/*",
            }
        }));
    }

    metalsmith
	.use(less({
	    render: {
	        paths: [
	            paths.src+'/assets/css/',
	        ],
	    },
        useDynamicSourceMap: true
	}))
    .use(autoprefixer)
    // .use(cleanCSS({
    //     files: '**/*.css'
    // }))
    .use(uglify())
    .use(siteData)
	.use(collections({
		pages: {
			pattern: 'content/pages/**/*.md'
		},
		posts: {
			pattern: 'content/posts/**/*.md'
		}
	}))
    .use(markdown({
        gfm: true
    }))
    .use(removeRenderless())
    .use( branch('**/content/**/*.html')
        .use(each(function(file, filename){
            var name = path.basename(filename);
            var filePath = path.dirname(filename);

            if (filename.indexOf('pages') !== -1) {
                filePath = filePath.split('content/pages/')[1];
            } else {
                filePath = filePath.split('content/')[1];
            }
            // save path as new name
            newName = filePath ? filePath +'/'+ name : name;
            // prepend slash to use as slug/link of file
            file.link = '/' + newName
            // if no template set use index.jade
            if (!file.template || file.template == undefined) {
                file.template = 'index.jade';
            }
            return newName;
        }))
    )
    // .use(findTemplate({
    //    pattern: 'posts',
    //    templateName: 'post.hbt'
    // }))
	.use(templates({
		engine: 'jade',
		directory: paths.templates
	}))
	.build(function(err, files) {
		if (err) {
			gutil.log(gutil.colors.black.bgYellow(err)); gutil.beep();
		}
		cb();
	});
});

gulp.task('browser-sync', function() {
  browserSync.init({
    files: [paths.build],
    watchOptions: {
        ignored: ['**/*.less', '**/*.map']
    },
    server: {
      baseDir: paths.build
    },
    open: false,
    notify: false,
    ghostMode: false,
    // tunnel: 'dillon',
  });

});

gulp.task('default', ['build', 'browser-sync']);