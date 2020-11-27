console.log('[NOTE] Applying patches on mocha hooks!');

const path = require('path');
const { addHook: addRequireHook } = require('pirates');

const patchPath = path.join(__dirname, 'apply.js');
const testDirPath = path.join(path.resolve('.'), '/');

addRequireHook(
	code => `require(${JSON.stringify(patchPath)});\n\n\n${code}`,
	{
		exts: ['.js'],
		matcher: filename => filename.startsWith(testDirPath)
	}
);
