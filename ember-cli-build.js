'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const MergeTree = require('broccoli-merge-trees');
const { has } = require('@ember/edition-utils');

module.exports = function (defaults) {
  let hasOctane = has('octane');
  let appTree = 'tests/dummy/app';
  if (hasOctane) {
    appTree = new MergeTree(['tests/dummy/app', 'tests/colocation/app']);
  }

  let app = new EmberAddon(defaults, {
    // Add options here
    'ember-cli-babel': {
      throwUnlessParallelizable: true,
    },

    trees: {
      app: appTree,
    },

    babel: {
      plugins: [
        [
          require.resolve('babel-plugin-debug-macros'),
          {
            flags: [
              {
                name: '@ember/edition-fake-module',
                source: '@ember/edition-fake-module',
                flags: {
                  HAS_OCTANE: hasOctane,
                },
              },
            ],
          },
          'debug macros - octane flag',
        ],
      ],
    },
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  const { maybeEmbroider } = require('@embroider/test-setup');
  return maybeEmbroider(app, {
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
  });
};
