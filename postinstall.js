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

    installTypescript(hasModules30);
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

function installTypescript(hasModules30) {
    const installedTypeScriptVersion = getProjectTypeScriptVersion();
    const force = shouldInstallLatest(installedTypeScriptVersion, hasModules30);

    if (installedTypeScriptVersion && !force) {
        console.log(`Project already targets TypeScript ${installedTypeScriptVersion}`);
    } else {
        const command = force ?
            "npm install -D typescript@latest" :
            "npm install -D -E typescript@2.1.6"; // install exactly 2.1.6

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

function shouldInstallLatest(tsVersion, hasModules30) {
    if (!hasModules30) {
        return false;
    }

    const justVersion = clearPatch(tsVersion);
    return !tsVersion ||
        tsVersion === "2.2.0" ||
        justVersion[0] < 2 || // ex. 1.8.10
        justVersion[2] < 2; // ex. 2.1.6
}

function clearPatch(version) {
    return version && (version.startsWith("~") || version.startsWith("^")) ?
        version.substring(1) :
        version;
}
