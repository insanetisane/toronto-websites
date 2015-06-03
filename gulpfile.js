// PLUGINS
// ---------

var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var swig = require('swig');
var path = require('path');

var Metalsmith = require('metalsmith');
var watch = require('metalsmith-watch');
// styles:
var less = require('metalsmith-less');
var autoprefixer = require('metalsmith-autoprefixer');
var cleanCSS = require('metalsmith-clean-css');
// templates:
var templates = require('metalsmith-templates');
var markdown = require('metalsmith-markdown');
var collections = require('metalsmith-collections');
var branch = require('metalsmith-branch');
var permalinks = require('metalsmith-permalinks');
var each = require('metalsmith-each');
// scripts:
var uglify = require('metalsmith-uglify')
// development:
var browserSync = require("browser-sync").create();
var reload = require('browser-sync').reload;


// VARIABLES
// ---------
var paths = {
	src: './src',
	templates: './templates',
	build: './build/'
}

// FUNCTIONS
// ---------

function handleError(error){
  console.log(error.toString());
  this.emit('end');
  gutil.beep();
}

swig.setDefaults({
	cache: false,
	locals: {
		siteTitle: "metalsmith boil"
	}
});

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

var siteData = function(files, metalsmith, done) {
    var metadata = metalsmith.metadata();
    var site = require('./site.json');
    metadata.site = site;
    done();
};

// var plugin = function(config) {
// 	var content = {};
//     return function(files, metalsmith, done) {
// 		var metadata = metalsmith.metadata();

// 	    Object.keys(files).forEach(function(file){
// 			var collectedData = {};

// 			for (var file in files) {
// 				var data = files[file];

// 				var postType = path.dirname(file).split('content/')[1];
// 				if (postType) {
// 			        collectedData[postType] = collectedData[postType] || [];
// 			        collectedData[postType].push(data);
// 				}

// 		    };

// 		    metadata.site = collectedData;
// 		});

//         for (var file in files) {
//             var _f = files[file];
// 			_f.site = metadata.site;
//         }
//         done();
//     };
// };

// TASKS
// -----

// METALSMITH

gulp.task('build', function(cb) {
	var metalsmith = Metalsmith(__dirname)
    // .use(watch())
    .use(watch({
        pattern: ['**/*', '../templates/**/*']
    }))
	.use(less({
	    render: {
	        paths: [
	            paths.src+'/assets/css/',
	        ],
	    },
        useDynamicSourceMap: true
	}))
    .use(autoprefixer)
    .use(cleanCSS({
        files: '**/*.css'
    }))
    .use(uglify())
    .use(siteData)
	.use(collections({
		pages: {
			pattern: 'content/pages/*.md'
		},
		posts: {
			pattern: 'content/posts/*.md'
		}
	}))
    .use(markdown({
        gfm: true
    }))
    .use(branch('**/content/pages/*.html')
        .use(each(function(file, filename){
            var name = path.basename(filename);
            file.link = name;
            return file.link;
        }))
    )
    .use( branch('**/content/**/*.html')
        .use(each(function(file, filename){
            var postType = path.dirname(filename).split('content/')[1];
            file.link = postType + "/" + path.basename(filename) || filename;
            return file.link;
        }))
    )
    // .use(findTemplate({
 //        pattern: 'posts',
 //        templateName: 'post.hbt'
 //    }))
	.use(templates({
		engine: 'swig',
		directory: paths.templates
	}))
    // .use(permalinks())
	.build(function(err) {
		if (err) {
			gutil.log(gutil.colors.black.bgYellow(err)); gutil.beep();
		}
		cb()
	});
});

gulp.task('reload', function() {
    browserSync.reload();
});

gulp.task('watch',['browser-sync'], function() {
  gulp.watch(paths.templates + '**/*', ['build']); // Temporoary solution to trigger rebuilds on template changes
  gulp.watch(paths.build + '**/*', ['reload']);
});

gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: paths.build
    },
    open: false,
    notify: false,
    ghostMode: false
    // tunnel: 'dillon',
    // middleware : function (req, res, next) {
        // build(next);
    // }
  });
    // browserSync({
    //     server: {
    //       baseDir: paths.build
    //     },
    //     // files: ["src/**/*", "templates/**/*"],
    //     open: false,
    //     middleware : function (req, res, next) {
    //         build(next);
    //     }
    // });

});

gulp.task('clean', function (cb) {
  return del([
      build
    ], cb);
});

gulp.task('default', ['build', 'watch']);