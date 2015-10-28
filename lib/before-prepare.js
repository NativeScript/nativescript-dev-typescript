var grunt = require('grunt');
var path = require('path');
var fs = require('fs');
var useTsconfig = fs.existsSync('tsconfig.json');

grunt.initConfig({
	ts: {
		default: {
			src: ['app/**/*.ts'],
			tsconfig: useTsconfig,
			options: {
				inlineSourceMap: true,
				failOnTypeErrors: false,
				module: "commonjs",
			}
		}
	}
});

// load grunt modules from own node_modules folder hack
// https://github.com/gruntjs/grunt/issues/696
var cwd = process.cwd();
process.chdir(path.join(__dirname, '..'));
grunt.loadNpmTasks('grunt-ts');
process.chdir(cwd);

// hack to avoid loading a Gruntfile
grunt.task.init = function () { };

grunt.tasks(['ts']);
