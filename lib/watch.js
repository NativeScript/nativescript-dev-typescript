var compiler = require('./compiler');

module.exports = function ($logger, $projectData, $errors) {
	compiler.runTypeScriptCompiler($logger, $projectData.projectDir, { watch: true })
		.then(function () { },
			function (err) {
				$errors.failWithoutHelp(err.toString());
			})
}
