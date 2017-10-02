var compiler = require('./compiler');

module.exports = function ($logger, $projectData, $options, hookArgs) {
	var liveSync = !!compiler.getTscProcess();
	var appFilesUpdaterOptions = (hookArgs && hookArgs.appFilesUpdaterOptions) || {};
	var bundle = $options.bundle || appFilesUpdaterOptions.bundle;

	if (liveSync || bundle) {
		return;
	}

	var release = $options.release || appFilesUpdaterOptions.release;
	return compiler.runTypeScriptCompiler($logger, $projectData.projectDir, { release });
}
