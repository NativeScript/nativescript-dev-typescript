var compiler = require('./compiler');

module.exports = function ($logger, $projectData, $usbLiveSyncService) {
	var liveSync = $usbLiveSyncService.isInitialized;
	var bundle = $projectData.$options.bundle;
	if (liveSync || bundle) {
		return;
	}
	return compiler.runTypeScriptCompiler($logger, $projectData.projectDir, { release: $projectData.$options.release });
}
