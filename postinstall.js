var hook = require('nativescript-hook')(__dirname);
hook.postinstall();

var fs = require('fs');
var path = require('path');

var projectDir = hook.findProjectDir();
if (projectDir) {
	createTsconfig();
	installTypescript();
}

function createTsconfig() {
	var tsconfigPath = path.join(projectDir, 'tsconfig.json');
	var tsconfig = {};

	if (fs.existsSync(tsconfigPath)) {
		try {
			tsconfig = JSON.parse(fs.readFileSync(tsconfigPath))
		} catch (err) {
			console.warn('tsconfig.json: ' + err.toString());
		}
	}

	tsconfig.compilerOptions = tsconfig.compilerOptions || {
		module: "commonjs",
		target: "es5",
		inlineSourceMap: true,
		experimentalDecorators: true,
	};

	var coreModulesPath = 'node_modules/tns-core-modules/';
	var coreModulesTypingsPath = 'node_modules/tns-core-modules/tns-core-modules.d.ts';

	try {
		var coreModulesPackageJson = JSON.parse(fs.readFileSync(path.join(projectDir, coreModulesPath, 'package.json')));
		if (coreModulesPackageJson.typings) {
			coreModulesTypingsPath = coreModulesPath + coreModulesPackageJson.typings;
		}
	} catch (err) {
		console.warn('tns-core-modules/package.json: ' + err.toString());
	}


	var expectedGlobs = [
		'app/**/*.ts',
		coreModulesTypingsPath,
	];

	tsconfig.files = tsconfig.files || [];
	var files = tsconfig.filesGlob = tsconfig.filesGlob || [];
	expectedGlobs.forEach(function (glob) {
		if (files.indexOf(glob) === -1) {
			files.unshift(glob);
		}
	});

	fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 4));
}

function installTypescript() {
	require('child_process').exec('npm install --save-dev typescript', { cwd: projectDir }, function (err, stdout, stderr) {
		if (err) {
			console.warn('npm: ' + err.toString());
		}
		process.stdout.write(stdout);
		process.stderr.write(stderr);
	});
}