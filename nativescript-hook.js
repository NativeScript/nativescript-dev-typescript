var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');

function generateHookName(pkg, hook) {
	return pkg.name + '.js';
}

function forEachHook(pkgdir, callback) {
	var pkg = require(path.join(pkgdir, 'package.json'));
	var ns = pkg.nativescript;
	if (!ns) {
		throw Error('Not a NativeScript development module.');
	}

	var hooksDir = process.env['TNS_HOOKS_DIR'];
	if (!hooksDir) {
		console.warn('This module should be installed through the `tns install` command, not npm.');
		process.exit(1);
	}

	if (ns.hooks) {
		ns.hooks.forEach(function (hook) {
			callback(hooksDir, pkg, hook)
		});
	}
}

exports.postinstall = function postinstall(pkgdir) {
	forEachHook(pkgdir, function (hooksDir, pkg, hook) {
		var hookDir = path.join(hooksDir, hook.type);
		if (!fs.existsSync(hookDir)) {
			mkdirp.sync(hookDir);
		}
		var hookFileName = generateHookName(pkg, hook);
		fs.writeFileSync(path.join(hookDir, hookFileName),
			util.format('require("%s/%s");' + os.EOL, pkg.name, hook.script));
	});
}

exports.preuninstall = function preuninstall(pkgdir) {
	forEachHook(pkgdir, function (hooksDir, pkg, hook) {
		var hookDir = path.join(hooksDir, hook.type);
		var hookFileName = path.join(hookDir, generateHookName(pkg, hook));
		if (fs.existsSync(hookFileName)) {
			fs.unlinkSync(hookFileName);
		}
	});
}
