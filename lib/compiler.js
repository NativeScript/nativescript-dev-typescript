exports.runTypeScriptCompiler = runTypeScriptCompiler;
exports.getTscProcess = getTscProcess;

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var semver = require('semver');
var tsc = null;

function getTypeScriptVersion(typeScriptPath) {
	try {
		return require(path.join(typeScriptPath, 'package.json')).version;
	} catch (err) { }

	return null;
}

function shouldPreserveWatchOutput(typeScriptVersion) {
	try {
		return semver.gte(typeScriptVersion, "2.8.1");
	} catch (err) { }

	return false;
}

function runTypeScriptCompiler(logger, projectDir, options) {
	return new Promise(function (resolve, reject) {
		options = options || {};

		var peerTypescriptPath = path.join(__dirname, '../../typescript');
		var tscPath = path.join(peerTypescriptPath, 'lib/tsc.js');
		var typeScriptVersion = getTypeScriptVersion(peerTypescriptPath);
		
		if (fs.existsSync(tscPath)) {
			logger.info(`Found peer TypeScript ${typeScriptVersion}`);
		} else {
			throw Error('TypeScript installation local to project was not found. Install by executing `npm install typescript`.');
		}

		var tsconfigPath = path.join(projectDir, 'tsconfig.json');
		if (!fs.existsSync(tsconfigPath)) {
			throw Error('No tsconfig.json file found in project.');
		}

		var nodeArgs = ['--max_old_space_size=4096', tscPath, '--project', projectDir];
		if (options.watch) {
			nodeArgs.push('--watch');
		}

		if (!options.release) {
			// For debugging in Chrome DevTools
			nodeArgs.push('--inlineSourceMap', '--inlineSources');
		}

		if (shouldPreserveWatchOutput(typeScriptVersion)) {
			nodeArgs.push('--preserveWatchOutput');
		}

		logger.trace(process.execPath, nodeArgs.join(' '));
		tsc = spawn(process.execPath, nodeArgs);

		var isResolved = false;
		tsc.stdout.on('data', function (data) {
			var stringData = data.toString();
			// Prevent console clear. Fixed the behaviour for typescript 2.7.1 and 2.7.2. Should be deleted after dropping support for 2.7.x version.
			// https://github.com/Microsoft/TypeScript/blob/master/src/compiler/sys.ts#L623
			if (stringData !== "\x1Bc") {
				logger.info(stringData);
			}
			if (options.watch && stringData.toLowerCase().indexOf("compilation complete. watching for file changes.") !== -1 && !isResolved) {
				isResolved = true;
				resolve();
			}
		});

		tsc.stderr.on('data', function (data) {
			logger.info(data.toString());
		});

		tsc.on('error', function (err) {
			logger.info(err.message);
			if (!isResolved) {
				isResolved = true;
				reject(err);
			}
		});

		// TODO: Consider using close event instead of exit
		tsc.on('exit', function (code, signal) {
			tsc = null;
			if (!isResolved) {
				isResolved = true;
				// ExitStatus  enum in https://github.com/Microsoft/TypeScript/blob/master/src/compiler/types.ts#L2620
				if (code === 0 || code === 2) {
					resolve();
				} else {
					reject(new Error('TypeScript compiler failed with exit code ' + code));
				}
			}
		});
	});
}

function getTscProcess() {
	return tsc;
}
