var hook = require("nativescript-hook")(__dirname);
hook.postinstall();

var fs = require("fs");
var path = require("path");
var upgrader = require("./tsconfig-upgrader");

var projectDir = hook.findProjectDir();
if (projectDir) {
	var tsconfigPath = path.join(projectDir, "tsconfig.json");
    var hasModules30 = upgrader.hasModules30(projectDir);
	if (fs.existsSync(tsconfigPath)) {
		upgrader.migrateTsConfig(tsconfigPath, projectDir);
	} else {
		createTsconfig(tsconfigPath);
	}

	if (!hasModules30) {
		createReferenceFile();
	}

	installTypescript({force: hasModules30});
}

function createReferenceFile() {
	var referenceFilePath = path.join(projectDir, "references.d.ts"),
		content = "/// <reference path=\"./node_modules/tns-core-modules/tns-core-modules.d.ts\" /> Needed for autocompletion and compilation.";

	if (!fs.existsSync(referenceFilePath)) {
		fs.appendFileSync(referenceFilePath, content);
	}
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
	upgrader.migrateProject(tsconfig, tsconfigPath, projectDir);

	tsconfig.exclude = ["node_modules", "platforms", "**/*.aot.ts"];

	fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 4));
}

function getProjectTypeScriptVersion() {
	try {
		var packageJsonPath = path.join(projectDir, "package.json"),
			packageJsonContent = fs.readFileSync(packageJsonPath, "utf8"),
			jsonContent = JSON.parse(packageJsonContent);

		return (jsonContent.dependencies && jsonContent.dependencies.typescript) ||
            (jsonContent.devDependencies && jsonContent.devDependencies.typescript);
	} catch (err) {
		console.error(err);
		return null;
	}
}

function installTypescript({force = false} = {}) {
	const installedTypeScriptVersion = getProjectTypeScriptVersion();

	if (installedTypeScriptVersion && !force) {
		console.log("Project already targets TypeScript " + installedTypeScriptVersion);
	} else {
        const command = force ? "npm install -D typescript@latest" : "npm update -D typescript";

        console.log("Installing TypeScript...");

		require("child_process").exec(command, { cwd: projectDir }, function (err, stdout, stderr) {
			if (err) {
				console.warn("npm: " + err.toString());
			}
			process.stdout.write(stdout);
			process.stderr.write(stderr);
		});
	}
}
