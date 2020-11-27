function replaceLastElementInArray(array, replacer) {
	array = array.slice();
	if (array.length === 0) return array;
	array.push(replacer(array.pop()));
	return array;
}

/**
 * Modifies the given `error` object, prepending the given string to its error message.
 */
function prependToErrorMessage(error, stringToPrepend) {
	const newMessage = stringToPrepend + error.message;
	const typePrefix = error.name + ': ';
	error.stack = error.stack.replace(typePrefix + error.message, typePrefix + newMessage);
	error.message = newMessage;
}

/**
 * Create a new function based on `fn` that wraps itself in a try-catch and
 * calls `catchHandler(error)` if an error is thrown.
 *
 * Works for sync and async functions.
 */
function wrapCatching(fn, catchHandler) {
	return function(...args) {
		try {
			const result = fn.apply(this, args);
			if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
				return result.catch(error => catchHandler.call(this, error));
			}
			return result;
		} catch (error) {
			return catchHandler.call(this, error);
		}
	};
}

module.exports = {
	replaceLastElementInArray,
	prependToErrorMessage,
	wrapCatching
};
