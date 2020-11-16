const stream = require('stream');
const { promisify } = require('util');
const jetpack = require('fs-jetpack');
const tempy = require('tempy');
const { unzip } = require('@papb/zip');
const got = require('got');

const pipeline = promisify(stream.pipeline);

/** Download a file from the internet into the given path */
async function download(url, destinationPath) {
  await pipeline(
    got.stream(url),
    jetpack.createWriteStream(destinationPath)
  );
}

/** @returns absolute path to temp directory containing the source code */
async function downloadSequelizeSourceCode(tagOrBranchName) {
  const tempDir = jetpack.cwd(tempy.directory());
  await download(
    `https://github.com/sequelize/sequelize/archive/${tagOrBranchName}.zip`,
    tempDir.path('sequelize.zip')
  );
  const unzipped = await unzip(tempDir.path('sequelize.zip'));
  await tempDir.removeAsync('.');

  // The zip file provided by GitHub, when unzipped, yields a single folder.
  // We have to get inside that folder first.
  const unzippedContents = jetpack.list(unzipped);
  return jetpack.path(unzipped, unzippedContents[0]);
}

(async () => {
  const tagOrBranchName = process.env.SEQUELIZE_GITHUB_REF;

  if (!tagOrBranchName) {
    console.log('Environment variable SEQUELIZE_GITHUB_REF not set. Aborting.');
    return;
  }

  console.log(`Downloading source code for Sequelize ${tagOrBranchName} directly from GitHub...`);
  const sequelizeDir = await downloadSequelizeSourceCode(tagOrBranchName);
  console.log(`Done.`);
  await jetpack.removeAsync('.downloaded-sequelize');
  await jetpack.moveAsync(sequelizeDir, '.downloaded-sequelize');
  console.log('Source code written to: .downloaded-sequelize');
})();
