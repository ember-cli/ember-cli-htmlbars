'use strict';

const getChannelURL = require('ember-source-channel-url');
const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

module.exports = async function () {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-lts-4.12',
        npm: {
          devDependencies: {
            'ember-source': '~3.24.3',
            'ember-cli': '~3.24.0',
          },
        },
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release'),
            '@ember/string': '^3.1.1',
          },
          ember: {
            edition: 'octane',
          },
        },
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('beta'),
            '@ember/string': '^3.1.1',
          },
          ember: {
            edition: 'octane',
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('canary'),
            '@ember/string': '^3.1.1',
          },
          ember: {
            edition: 'octane',
          },
        },
      },
      embroiderSafe(),
      embroiderOptimized(),
    ],
  };
};
