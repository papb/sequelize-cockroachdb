'use strict';

// --------------------------------------------------------------
// https://github.com/sindresorhus/p-timeout/issues/16

const { setTimeout, clearTimeout } = global;

const pFinally = require('p-finally');

class TimeoutError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TimeoutError';
	}
}

const pTimeout = (promise, milliseconds, fallback) => new Promise((resolve, reject) => {
	if (typeof milliseconds !== 'number' || milliseconds < 0) {
		throw new TypeError('Expected `milliseconds` to be a positive number');
	}

	if (milliseconds === Infinity) {
		resolve(promise);
		return;
	}

	const timer = setTimeout(() => {
		if (typeof fallback === 'function') {
			try {
				resolve(fallback());
			} catch (error) {
				reject(error);
			}

			return;
		}

		const message = typeof fallback === 'string' ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
		const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);

		if (typeof promise.cancel === 'function') {
			promise.cancel();
		}

		reject(timeoutError);
	}, milliseconds);

	// TODO: Use native `finally` keyword when targeting Node.js 10
	pFinally(
		// eslint-disable-next-line promise/prefer-await-to-then
		promise.then(resolve, reject),
		() => {
			clearTimeout(timer);
		}
	);
});

// --------------------------------------------------------------

const Support = require('../support');

let runningQueries = new Set();

before(function() {
  this.sequelize.addHook('beforeQuery', (options, query) => {
    runningQueries.add(query);
  });
  this.sequelize.addHook('afterQuery', (options, query) => {
    runningQueries.delete(query);
  });
});

beforeEach(async function() {
  await Support.clearDatabase(this.sequelize);
});

afterEach(async function() {
  let runningQueriesProblem;

  if (runningQueries.size > 0) {
    runningQueriesProblem =
      `There are still ${
        runningQueries.size
      } query(ies) running (or, at least, the \`afterQuery\` sequelize hook did not fire):\n\n${
        [...runningQueries].map(query => `       ${query.uuid}: ${query.sql}`).join('\n')
      }`;
  }

  runningQueries = new Set();

  try {
    await pTimeout(
      Support.clearDatabase(this.sequelize),
      3000,
      'Could not clear database after this test in less than 3000ms. This test broke the DB, and no tests can continue. Aborting.'
    );
  } catch (error) {
    let message = error.message;
    if (runningQueriesProblem) {
      message += '\n\n     Also, ' + runningQueriesProblem;
    }
    message += '\n\n     Full test name:\n       ' + this.currentTest.fullTitle();
    throw new Error(message);
  }

  if (runningQueriesProblem) {
    if (this.test.ctx.currentTest.state === 'passed') {
      this.test.error(new Error('Test passed but ' + runningQueriesProblem));
    } else {
      console.log('     ' + runningQueriesProblem);
    }
  }
});

module.exports = Support;
