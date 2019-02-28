var compiler = require('./compiler');

module.exports = function ($logger) {
	var tsc = compiler.getTscProcess();
	if (tsc) {
		$logger.trace("Stopping tsc watch");
		tsc.kill("SIGINT")
	}
}
