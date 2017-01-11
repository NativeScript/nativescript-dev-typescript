var hook = require('nativescript-hook')(__dirname);
hook.postinstall();

var fs = require('fs');
var path = require('path');

var projectDir = hook.findProjectDir();
if (projectDir) {
	var tsconfigPath = path.join(projectDir, 'tsconfig.json');
	if (fs.existsSync(tsconfigPath)) {
		migrateTsconfig(tsconfigPath);
	} else {
		createTsconfig(tsconfigPath);
	}
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

function migrateTsconfig(tsconfigPath) {
	var displaybleTsconfigPath = path.relative(projectDir, tsconfigPath);

	try {
		var existingConfigContents = fs.readFileSync(tsconfigPath);
		var existingConfig = JSON.parse(existingConfigContents);
	} catch (e) {
		console.error("Invalid " + displaybleTsconfigPath + ": " + e);
		return;
	}

	if (existingConfig["compilerOptions"]) {
		if ("sourceMap" in existingConfig["compilerOptions"]) {
			delete existingConfig["compilerOptions"]["sourceMap"];
			console.warn("> Deleted \"compilerOptions.sourceMap\" setting in \"" + displaybleTsconfigPath + "\".");
			console.warn("> Inline source maps will be used when building in Debug configuration from now on.");
		}
	}

	fs.writeFileSync(tsconfigPath, JSON.stringify(existingConfig, null, 4));
}

function createTsconfig(tsconfigPath) {
	var tsconfig = {};

	tsconfig.compilerOptions = {
		module: "commonjs",
		target: "es5",
		experimentalDecorators: true,
		emitDecoratorMetadata: true,
		noEmitHelpers: true,
		noEmitOnError: true,
	};

	tsconfig.exclude = ['node_modules', 'platforms', "**/*.aot.ts"];

	fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 4));
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
