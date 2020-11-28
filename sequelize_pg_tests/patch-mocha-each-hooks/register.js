console.log('[NOTE] Applying patches on mocha hooks!');

const path = require('path');
const { addHook: addRequireHook } = require('pirates');

// Add `preventTimerStubbing` to `p-timeout`, see https://github.com/sindresorhus/p-timeout/issues/16
addRequireHook(
  code => `
    'use strict';
    const cachedSetTimeout = setTimeout;
    const cachedClearTimeout = clearTimeout;
    (() => {
    ${
      code
        .replace(
          'const pTimeout = (promise, milliseconds, fallback) =>',
          'const pTimeout = (promise, milliseconds, fallback, preventTimerStubbing) =>',
        )
        .replace(
          /setTimeout/g,
          '(preventTimerStubbing ? cachedSetTimeout : setTimeout)'
        )
        .replace(
          /clearTimeout/g,
          '(preventTimerStubbing ? cachedClearTimeout : clearTimeout)'
        )
    }
    })();
  `,
	{
		matcher: filename => filename.includes('\\node_modules\\p-timeout\\'),
    ignoreNodeModules: false
	}
);

// Patch our test files
const patchPath = path.join(__dirname, 'apply.js');
const testDirPath = path.join(path.resolve('.'), '/');

addRequireHook(
	code => `require(${JSON.stringify(patchPath)});\n\n\n${code}`,
	{
		exts: ['.js'],
		matcher: filename => filename.startsWith(testDirPath)
	}
);
