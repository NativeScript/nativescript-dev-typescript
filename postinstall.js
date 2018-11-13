var hook = require("nativescript-hook")(__dirname);
hook.postinstall();

var fs = require("fs");
var path = require("path");
var upgrader = require("./tsconfig-upgrader");

var projectDir = hook.findProjectDir();
if (projectDir) {
    const tsconfigPath = path.join(projectDir, "tsconfig.json");
    if (fs.existsSync(tsconfigPath)) {
        upgrader.migrateTsConfig(tsconfigPath, projectDir);
    } else {
        createTsconfig(tsconfigPath);
    }

    const hasModules30 = upgrader.hasModules30(projectDir);
    if (!hasModules30) {
        createReferenceFile();
    }

    installTypescript();
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

    tsconfig.exclude = ["node_modules", "platforms"];

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
    const installedTypeScriptVersion = getProjectTypeScriptVersion();
    const force = shouldInstallLatest(installedTypeScriptVersion);

    if (installedTypeScriptVersion && !force) {
        console.log(`Project already targets TypeScript ${installedTypeScriptVersion}`);
    } else {
        const command = "npm install -D typescript@latest";

        console.log("Installing TypeScript...");

        require("child_process").exec(command, { cwd: projectDir }, (err, stdout, stderr) => {
            if (err) {
                console.warn(`npm: ${err.toString()}`);
            }

            process.stdout.write(stdout);
            process.stderr.write(stderr);
        });
    }
}

function shouldInstallLatest(tsVersion) {
    if (!tsVersion) {
        return true;
    }

    const justVersion = clearPatch(tsVersion);
    const majorVer = justVersion[0];
    const minorVer = justVersion[2];

    return tsVersion === "2.2.0" ||
        majorVer < 2 || // ex. 1.8.10
        (majorVer === "2" && minorVer < 2); // ex. 2.1.6
}

function clearPatch(version) {
    return version && (version.startsWith("~") || version.startsWith("^")) ?
        version.substring(1) :
        version;
}
