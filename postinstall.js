var hook = require("nativescript-hook")(__dirname);
hook.postinstall();

var fs = require("fs");
var path = require("path");

var __migrations = [
	inlineSourceMapMigration,
	addDomLibs,
	addIterableToAngularProjects,
];


var projectDir = hook.findProjectDir();
if (projectDir) {
	var tsconfigPath = path.join(projectDir, "tsconfig.json");
	if (fs.existsSync(tsconfigPath)) {
		migrateTsconfig(tsconfigPath);
	} else {
		createTsconfig(tsconfigPath);
	}
	createReferenceFile();
	installTypescript();
}

function createReferenceFile() {
	var referenceFilePath = path.join(projectDir, "references.d.ts"),
		content = '/// <reference path="./node_modules/tns-core-modules/tns-core-modules.d.ts" /> Needed for autocompletion and compilation.';

	if (!fs.existsSync(referenceFilePath)) {
		fs.appendFileSync(referenceFilePath, content);
	}
}

function inlineSourceMapMigration(existingConfig, displayableTsconfigPath) {
	if (existingConfig.compilerOptions) {
		if ("sourceMap" in existingConfig["compilerOptions"]) {
			delete existingConfig["compilerOptions"]["sourceMap"];
			console.warn("> Deleted \"compilerOptions.sourceMap\" setting in \"" + displayableTsconfigPath + "\".");
			console.warn("> Inline source maps will be used when building in Debug configuration from now on.");
		}
	}
}

function addIterableToAngularProjects(existingConfig) {
	var packageJsonPath = path.join(projectDir, "package.json");
	var packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
	var dependencies = packageJson.dependencies || [];

	var hasAngular = Object.keys(dependencies).includes("nativescript-angular");
    var hasRelevantAngularVersion = /[4-9]\.\d+\.\d+/i.test(dependencies["@angular/core"]);
	if (hasAngular && hasRelevantAngularVersion) {
        console.log("Adding 'es2015.iterable' lib to tsconfig.json...");
		addTsLib(existingConfig, "es2015.iterable");
	}
}

function addDomLibs(existingConfig) {
	function relevantModulesVersion(version) {
		return /[3-9]\.\d+\.\d+/i.test(version);
	}

	function hasRelevantModulesDependency() {
		var packageJsonPath = path.join(projectDir, "package.json");
		var packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
		var dependencies = packageJson.dependencies || [];

		return relevantModulesVersion(dependencies["tns-core-modules"]);
	}

	function hasRelevantModulesPackage() {
		var packageJsonPath = path.join(projectDir, "node_modules", "tns-core-modules", "package.json");
		if (!fs.existsSync(packageJsonPath)) {
			return false;
		}

		var packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
		return relevantModulesVersion(packageJson.version);
	}

	if (hasRelevantModulesDependency() || hasRelevantModulesPackage()) {
        console.log("Adding 'es6' lib to tsconfig.json...");
		addTsLib(existingConfig, "es6");
        console.log("Adding 'dom' lib to tsconfig.json...");
		addTsLib(existingConfig, "dom");
	}
}

function addTsLib(existingConfig, libName) {
	if (existingConfig.compilerOptions) {
		var options = existingConfig.compilerOptions;
		if (!options.lib) {
			options.lib = [];
		}
		if (!options.lib.find(function(l) {
				return libName.toLowerCase() === l.toLowerCase();
			})) {
			options.lib.push(libName);
		}
	}
}

function migrateTsconfig(tsconfigPath) {
	var displayableTsconfigPath = path.relative(projectDir, tsconfigPath);

	function withTsConfig(action) {
		var existingConfig = null;
		try {
			var existingConfigContents = fs.readFileSync(tsconfigPath);
			existingConfig = JSON.parse(existingConfigContents);
		} catch (e) {
			console.error("Invalid " + displayableTsconfigPath + ": " + e);
			return;
		}
		action(existingConfig);
		fs.writeFileSync(tsconfigPath, JSON.stringify(existingConfig, null, 4));
	}

	withTsConfig(function(existingConfig) {
		__migrations.forEach(function(migration) {
			migration(existingConfig, displayableTsconfigPath);
		});
	});
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
	addDomLibs(tsconfig);
	addIterableToAngularProjects(tsconfig);

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

function installTypescript() {
	var installedTypeScriptVersion = getProjectTypeScriptVersion();
	if (installedTypeScriptVersion) {
		console.log("Project already targets TypeScript " + installedTypeScriptVersion);
	} else {
		require("child_process").exec("npm install --save-dev typescript", { cwd: projectDir }, function (err, stdout, stderr) {
			if (err) {
				console.warn("npm: " + err.toString());
			}
			process.stdout.write(stdout);
			process.stderr.write(stderr);
		});
	}
}
