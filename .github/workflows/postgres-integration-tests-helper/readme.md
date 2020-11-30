# Helper scripts for executing Sequelize integration tests for postgres targeting CockroachDB instead

This folder contains helper scripts to execute Sequelize's own integration tests for postgres (but targeting CockroachDB instead).

These files are only used from the GitHub Action specified in `ci.yml`.

## Main idea

The workflow will work as follows:

* Download the Sequelize source code into a temporary folder called `.downloaded-sequelize`
* Install all Sequelize dependencies (in order to be able to run all Sequelize's own tests)
* Copy `sequelize-cockroachdb` source code into `.downloaded-sequelize/.cockroachdb-patches/`
* Tell Sequelize to execute our code (in `.downloaded-sequelize/.cockroachdb-patches/`) before running the tests
* Run Sequelize tests

## Helper files

### patch-test-integration-support.js

This file will be used as a direct replacement for the `test/integration/support.js` file within Sequelize source code.

It was created by modifying Sequelize's [`test/integration/support.js`](https://github.com/sequelize/sequelize/blob/e34efd477d051af6796c277406be26bb1d2c2f23/test/integration/support.js). (Note: the modified version is also appropriate to be used in place of [the existing code for v5](https://github.com/sequelize/sequelize/blob/5f9d5907425ae1d86b402133718d007a52f2b39e/test/integration/support.js)).

It improves the `afterEach` hook that checks for *queries still running*, in order to prevent a test crash when it is still possible to recover by clearing the database.

### put-our-patches-in-downloaded-sequelize.js

Our source code imports sequelize via `require('sequelize')`. However, to run Sequelize integrations tests for postgres, we will be inside the Sequelize source code itself, so instead of `'sequelize'` we need to require the appropriate relative path.

When executed, this script wraps the source code from `sequelize-cockroachdb` with a patch to the `require` method, to make it find Sequelize correctly, using the relative path as mentioned above. Then, it writes the wrapped source code into `.downloaded-sequelize/.cockroachdb-patches/`, to be ready for use by the GitHub Action.

Note: since our files will be copied into `.downloaded-sequelize/.cockroachdb-patches/`, the correct relative path is `'..'`.
