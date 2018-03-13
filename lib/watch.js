var compiler = require('./compiler');

module.exports = function ($logger, $projectData, $errors, hookArgs) {
	if (hookArgs.config) {
		const appFilesUpdaterOptions = hookArgs.config.appFilesUpdaterOptions;
		if (appFilesUpdaterOptions.bundle) {
			$logger.warn("Hook skipped because bundling is in progress.")
			return;
		}
	}

	const watchAllFiles = hookArgs && hookArgs.config && hookArgs.config.appFilesUpdaterOptions && hookArgs.config.appFilesUpdaterOptions.watchAllFiles;

	return compiler.runTypeScriptCompiler($logger, $projectData.projectDir, { watch: true, release: $projectData.$options.release, watchAllFiles: watchAllFiles });
}
