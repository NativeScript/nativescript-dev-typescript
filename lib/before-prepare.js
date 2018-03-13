var compiler = require('./compiler');

module.exports = function ($logger, $projectData, $options, hookArgs) {
	var liveSync = !!compiler.getTscProcess();
	var appFilesUpdaterOptions = (hookArgs && hookArgs.appFilesUpdaterOptions) || {};
	var bundle = $options.bundle || appFilesUpdaterOptions.bundle;

	if (liveSync || bundle) {
		$logger.warn("Hook skipped because either bundling or livesync is in progress.")
		return;
	}

	var release = $options.release || appFilesUpdaterOptions.release;
	var watchAllFiles = ($options && $options.syncAllFiles) || appFilesUpdaterOptions.watchAllFiles;
	return compiler.runTypeScriptCompiler($logger, $projectData.projectDir, { release, watchAllFiles });
}
