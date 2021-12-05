'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = function () {
  return Promise.all([
    getChannelURL('release'),
    getChannelURL('beta'),
    getChannelURL('canary'),
  ]).then((urls) => {
    return {
      useYarn: true,
      scenarios: [
        {
          name: 'ember-lts-3.8',
          npm: {
            devDependencies: {
              'ember-source': '~3.8.0',
            },
          },
        },
        {
          name: 'ember-lts-3.12',
          npm: {
            devDependencies: {
              'ember-source': '~3.12.0',
            },
          },
        },
        {
          name: 'ember-lts-3.16',
          npm: {
            devDependencies: {
              'ember-source': '~3.16.0',
            },
          },
        },
        {
          name: 'ember-lts-3.28',
          npm: {
            devDependencies: {
              'ember-source': '~3.28.0',
            },
          },
        },
        {
          name: 'ember-release',
          npm: {
            devDependencies: {
              'ember-auto-import': '^2.2.3',
              'ember-source': urls[0],
              webpack: '^5.52.1',
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
              'ember-auto-import': '^2.2.3',
              'ember-source': urls[1],
              webpack: '^5.52.1',
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
              'ember-auto-import': '^2.2.3',
              'ember-source': urls[2],
              webpack: '^5.52.1',
            },
            ember: {
              edition: 'octane',
            },
          },
        },
        {
          name: 'ember-default',
          npm: {
            devDependencies: {},
          },
        },
        {
          name: 'ember-octane',
          ENV: {
            // need to add a convienient API for this to @ember/edition-utils
            EMBER_EDITION: 'octane',
          },
          npm: {
            devDependencies: {},
          },
        },
        {
          name: 'with-ember-cli-htmlbars-inline-precompile',
          npm: {
            devDependencies: {
              'ember-cli-htmlbars-inline-precompile': '^3.0.0',
            },
          },
        },
        {
          name: 'ember-default-with-jquery',
          env: {
            EMBER_OPTIONAL_FEATURES: JSON.stringify({
              'jquery-integration': true,
            }),
          },
          npm: {
            devDependencies: {
              '@ember/jquery': '^0.5.1',
            },
          },
        },
      ],
    };
  });
};
