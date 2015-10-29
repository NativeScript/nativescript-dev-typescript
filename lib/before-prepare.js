var grunt = require('grunt');
var path = require('path');
var fs = require('fs');
var options = require('./ts-defaults');
var useTsconfig = fs.existsSync('tsconfig.json');

var peerTypescriptPath = path.join(__dirname, '../../typescript');
var tscPath = path.join(peerTypescriptPath, 'bin/tsc');
if (fs.existsSync(tscPath)) {
	try {
		console.log('Found peer TypeSscript ' + require(path.join(peerTypescriptPath, 'package.json')).version);
	} catch (err) { }
	options.compiler = tscPath;
}

grunt.initConfig({
	ts: {
		default: {
			src: ['app/**/*.ts'],
			tsconfig: useTsconfig,
			options: options,
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
