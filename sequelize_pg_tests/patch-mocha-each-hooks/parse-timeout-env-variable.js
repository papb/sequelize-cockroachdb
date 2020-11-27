const { PATCH_MOCHA_TIMEOUT } = process.env;

const mustPatchTimeout = Boolean(PATCH_MOCHA_TIMEOUT);

if (mustPatchTimeout && !/^\d+$/.test(PATCH_MOCHA_TIMEOUT)) {
	throw new Error('Invalid PATCH_MOCHA_TIMEOUT environment variable: ' + PATCH_MOCHA_TIMEOUT);
}

const wantedHookTimeout = mustPatchTimeout ? Number.parseInt(PATCH_MOCHA_TIMEOUT, 10) : undefined;

module.exports = { mustPatchTimeout, wantedHookTimeout };
