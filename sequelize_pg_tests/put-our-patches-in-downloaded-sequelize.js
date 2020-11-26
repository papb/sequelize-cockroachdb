const jetpack = require('fs-jetpack');
const { outdent } = require('outdent');

const sequelizeCockroachdbSourceFiles = ['index.js', 'patch-upsert-v5.js'];

function wrapFile(sourcePath, destinationPath) {
  const contents = jetpack.read(sourcePath);
  jetpack.write(
    destinationPath,
    outdent`
      const originalRequire = require;
      require = modulePath => originalRequire(modulePath.replace(/^sequelize\\b/, '..'));
      (() => {

      ${contents}

      })();
    `
  );
}

for (const file of sequelizeCockroachdbSourceFiles) {
  wrapFile(file, `.downloaded-sequelize/.cockroachdb-patches/${file}`);
}
