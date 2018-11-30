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
