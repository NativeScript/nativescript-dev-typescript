exports.runTypeScriptCompiler = runTypeScriptCompiler;

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var _ = require('lodash');

function runTypeScriptCompiler(logger, projectDir, options) {
	return new Promise(function (resolve, reject) {
		options = options || {};

		var peerTypescriptPath = path.join(__dirname, '../../typescript');
		var tscPath = path.join(peerTypescriptPath, 'lib/tsc.js');
		if (fs.existsSync(tscPath)) {
			try {
				logger.info('Found peer TypeScript ' + require(path.join(peerTypescriptPath, 'package.json')).version);
			} catch (err) { }
		} else {
			throw Error('TypeScript installation local to project was not found. Install by executing `npm install typescript`.');
		}

		var tsconfigPath = path.join(projectDir, 'tsconfig.json');
		if (!fs.existsSync(tsconfigPath)) {
			throw Error('No tsconfig.json file found in project.');
		}
		expandFilesGlob(tsconfigPath);

		var nodeArgs = [tscPath, '--project', projectDir];
		if (options.watch) {
			nodeArgs.push('--watch');
			watchForGlobUpdates(tsconfigPath);
		}

		var tsc = spawn(process.execPath, nodeArgs, { stdio: 'inherit' });
		tsc.on('exit', function (code, signal) {
			// EmitReturnStatus enum in https://github.com/Microsoft/TypeScript/blob/8947757d096338532f1844d55788df87fb5a39ed/src/compiler/types.ts#L605
			if (code === 0 || code === 2 || code === 3) {
				resolve();
			} else {
				reject(Error('TypeScript compiler failed with exit code ' + code));
			}
		});
	});
}

function expandFilesGlob(tsconfigPath) {
	var tsconfig = JSON.parse(fs.readFileSync(tsconfigPath));
	if (!(tsconfig.filesGlob instanceof Array)) {
		return;
	}

	var ignoreList = [];
	var searchList = [];

	tsconfig.filesGlob.forEach(function (fileGlob) {
		if (typeof fileGlob !== 'string') {
			return;
		}
		if (fileGlob[0] === '!') {
			ignoreList.push(fileGlob);
		} else {
			searchList.push(fileGlob);
		}
	});

	var allFiles = searchList.map(function (fileGlob) {
		return glob.sync(fileGlob, { ignore: ignoreList });
	});
	allFiles = _.flatten(allFiles);
	allFiles.sort();
	allFiles = _.unique(allFiles);

	if (!_.isEqual(tsconfig.files, allFiles)) {
		tsconfig.files = allFiles;
		fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
	}
}

function watchForGlobUpdates(tsconfigPath) {
	var Gaze = require('gaze').Gaze;

	var tsconfig = JSON.parse(fs.readFileSync(tsconfigPath));
	var globs = tsconfig.filesGlob;
	if (!(globs instanceof Array)) {
		return;
	}

	var update = function () {
		expandFilesGlob(tsconfigPath);
	};

	new Gaze(globs)
		.on('added', update)
		.on('deleted', update);

	new Gaze(tsconfigPath).on('changed', update);
}
