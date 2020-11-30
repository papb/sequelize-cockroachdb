// Copyright 2020 The Cockroach Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.

'use strict';

console.log('[INFO] Using custom patch for `test/integration/support.js`');
console.log('[INFO] Reading `Sequelize.supportsCockroachDB` from `test/integration/support.js` yields: ' + require('../..').supportsCockroachDB);

// Store local references to `setTimeout` and `clearTimeout` asap, so that we can use them within `p-timeout`,
// avoiding to be affected unintentionally by `sinon.useFakeTimers()` called by the tests themselves.
const { setTimeout, clearTimeout } = global;

const pTimeout = require('p-timeout');
const Support = require('../support');

const CLEANUP_TIMEOUT = Number.parseInt(process.env.CLEANUP_TIMEOUT, 10) || 30000;

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
      CLEANUP_TIMEOUT,
      `Could not clear database after this test in less than ${CLEANUP_TIMEOUT}ms. This test crashed the DB, and testing cannot continue. Aborting.`,
      { customTimers: { setTimeout, clearTimeout } }
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
