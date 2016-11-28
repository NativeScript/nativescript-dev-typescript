var hook = require('nativescript-hook')(__dirname);
hook.postinstall();

var fs = require('fs');
var path = require('path');

var projectDir = hook.findProjectDir();
if (projectDir) {
	createTsconfig();
	createReferenceFile();
	installTypescript();
}

function createReferenceFile() {
	var referenceFilePath = path.join(projectDir, 'references.d.ts'),
		content = '/// <reference path="./node_modules/tns-core-modules/tns-core-modules.d.ts" /> Needed for autocompletion and compilation.';

	if (!fs.existsSync(referenceFilePath)) {
		fs.appendFileSync(referenceFilePath, content);
	}
}

function createTsconfig() {
	var tsconfigPath = path.join(projectDir, 'tsconfig.json');
	var tsconfig = {};

	tsconfig.compilerOptions = {
		module: "commonjs",
		target: "es5",
		sourceMap: true,
		experimentalDecorators: true,
		emitDecoratorMetadata: true,
		noEmitHelpers: true,
		noEmitOnError: true,
	};

	tsconfig.exclude = ['node_modules', 'platforms', "**/*.aot.ts"];

	if (!fs.existsSync(tsconfigPath)) {
		fs.appendFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 4));
	}
}

function getProjectTypeScriptVersion() {
	try {
		var packageJsonPath = path.join(projectDir, "package.json"),
			packageJsonContent = fs.readFileSync(packageJsonPath, "utf8"),
			jsonContent = JSON.parse(packageJsonContent);

		return (jsonContent.dependencies && jsonContent.dependencies.typescript)
			|| (jsonContent.devDependencies && jsonContent.devDependencies.typescript);
	} catch (err) {
		console.error(err);
		return null;
	}
}

function installTypescript() {
	var installedTypeScriptVersion = getProjectTypeScriptVersion();
	if (installedTypeScriptVersion) {
		console.log("Project already targets TypeScript " + installedTypeScriptVersion);
	} else {
		require('child_process').exec('npm install --save-dev typescript', { cwd: projectDir }, function (err, stdout, stderr) {
			if (err) {
				console.warn('npm: ' + err.toString());
			}
			process.stdout.write(stdout);
			process.stderr.write(stderr);
		});
	}
}
