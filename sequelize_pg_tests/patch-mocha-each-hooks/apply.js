const pTimeout = require('p-timeout');
const { mustPatchTimeout, wantedHookTimeout } = require('./parse-timeout-env-variable');
const {
	replaceLastElementInArray,
	prependToErrorMessage,
	wrapCatching
} = require('./helpers');

function patchMochaCall(fnName, patcher) {
	const originalFn = global[fnName];
	global[fnName] = (...args) => originalFn(...replaceLastElementInArray(args, patcher));
}

for (const fnName of ['beforeEach', 'afterEach']) {
	patchMochaCall(fnName, fn => {
		// Instead of throwing an error, call `this.test.error` with it.
		function onError(error) {
			prependToErrorMessage(error, `[At \`${fnName}\` hook] `);
			this.test.error(error);
		}

		if (!mustPatchTimeout) return wrapCatching(fn, onError);

		const fnWithTimeoutPatched = function(...args) {
			this.timeout(0); // Tell mocha to not use their timeout.

			let timeoutErrorMessage = `[Mocha Patched Timeout Error] \`${fnName}\` did not complete within ${wantedHookTimeout}ms.`;
			if (this.test.file) timeoutErrorMessage += ' (' + this.test.file + ')';

			// Ensure it returns a Promise
			// If `fn` throws synchronously, we're fine
			const hookPromise = Promise.resolve(fn.apply(this, args));

			return pTimeout(hookPromise, wantedHookTimeout, timeoutErrorMessage);
		};

		return wrapCatching(fnWithTimeoutPatched, onError);
	});
}
