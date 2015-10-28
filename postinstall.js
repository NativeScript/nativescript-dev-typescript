require('./nativescript-hook').postinstall(__dirname);

var fs = require('fs');
var path = require('path');

var projectDir = process.env['TNS_PROJECT_DIR'];
var tsconfigPath = path.join(projectDir, 'tsconfig.json');
var tsconfig = {};

if (fs.existsSync(tsconfigPath)) {
	try {
		tsconfig = JSON.parse(fs.readFileSync(tsconfigPath))
	} catch (err) {
		console.warn('tsconfig.json: ' + err.toString());
	}
}

tsconfig.compilerOptions = tsconfig.compilerOptions || {};
tsconfig.compilerOptions.module = 'commonjs';

var expectedGlobs = [
	'app/**/*.ts',
	'node_modules/tns-core-modules/typings/declarations.d.ts',
];

tsconfig.files = tsconfig.files || [];
var files = tsconfig.filesGlob = tsconfig.filesGlob || [];
expectedGlobs.forEach(function (glob) {
	if (files.indexOf(glob) === -1) {
		files.unshift(glob);
	}
});

fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 4));
