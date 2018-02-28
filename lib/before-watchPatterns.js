module.exports = function (hookArgs) {
	if (hookArgs.liveSyncData && !hookArgs.liveSyncData.bundle) {
		return (args, originalMethod) => {
			return originalMethod(...args).then(originalPatterns => {
				originalPatterns.push("!app/**/*.ts");

				return originalPatterns;
			});
		};
	}
}
