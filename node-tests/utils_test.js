'use strict';

const utils = require('../lib/utils');
const assert = require('assert');

describe('utils', function() {
  let templateCompiler;

  describe('initializeEmberENV', function() {
    beforeEach(function() {
      templateCompiler = require('ember-source/dist/ember-template-compiler');
    });

    it('passes other ENV variables to compiler when provided', function() {
      let EmberENV = {
        FOO_BAR: true,
      };

      utils.initializeEmberENV(templateCompiler, EmberENV);

      assert.strictEqual(templateCompiler._Ember.ENV.FOO_BAR, true);
    });

    it('passes features through when provided', function() {
      let EmberENV = {
        FEATURES: {
          BLAH: true,
        },
      };

      utils.initializeEmberENV(templateCompiler, EmberENV);

      assert.strictEqual(templateCompiler._Ember.FEATURES.BLAH, true);
    });
  });

  describe('setupPlugins', function() {
    it('for 0 plugins', function() {
      let pluginWrappers = [];

      let actual = utils.setupPlugins(pluginWrappers);

      assert.deepStrictEqual(actual, {
        plugins: [],
        cacheKeys: [],
        parallelConfigs: [],
        canParallelize: true,
        unparallelizableWrappers: [],
        hasDependencyInvalidation: false,
      });
    });

    it('canParallelize for 1+ plugins with "parallelBabel" property', function() {
      let pluginWrappers = [
        {
          plugin() {},
          cacheKey() {
            return this.parallelBabel;
          },
          parallelBabel: 'something',
        },
        {
          plugin() {},
          cacheKey() {
            return this.parallelBabel;
          },
          parallelBabel: 'something else',
        },
      ];

      let actual = utils.setupPlugins(pluginWrappers);

      assert.deepStrictEqual(actual, {
        plugins: pluginWrappers.map(w => w.plugin),
        cacheKeys: ['something', 'something else'],
        parallelConfigs: ['something', 'something else'],
        canParallelize: true,
        unparallelizableWrappers: [],
        hasDependencyInvalidation: false,
      });
    });

    it('canParallelize is false for 1+ plugins without "parallelBabel" property', function() {
      let pluginWrappers = [
        {
          name: 'first',
          plugin() {},
          cacheKey() {
            return this.parallelBabel;
          },
          parallelBabel: 'something',
        },
        {
          name: 'second',
          plugin() {},
          cacheKey() {
            return 'something else';
          },
        },
      ];

      let actual = utils.setupPlugins(pluginWrappers);

      assert.deepStrictEqual(actual, {
        plugins: pluginWrappers.map(w => w.plugin),
        cacheKeys: ['something', 'something else'],
        parallelConfigs: ['something'],
        canParallelize: false,
        unparallelizableWrappers: ['second'],
        hasDependencyInvalidation: false,
      });
    });
  });
});
