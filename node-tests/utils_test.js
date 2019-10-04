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

  describe('isInlinePrecompileBabelPluginRegistered', function() {
    let nonParallelizablePlugin, parallelizablePlugin;

    beforeEach(function() {
      let modules = {
        'ember-cli-htmlbars': 'hbs',
        'ember-cli-htmlbars-inline-precompile': 'default',
        'htmlbars-inline-precompile': 'default',
      };

      nonParallelizablePlugin = [
        require.resolve('babel-plugin-htmlbars-inline-precompile'),
        { precompile: null, modules },
        'ember-cli-htmlbars:inline-precompile',
      ];

      let pluginInfo = { parallelConfigs: [], cacheKeys: [] };
      parallelizablePlugin = utils.buildParalleizedBabelPlugin(
        pluginInfo,
        require.resolve('ember-source/dist/ember-template-compiler')
      );

      [
        require.resolve('babel-plugin-htmlbars-inline-precompile'),
        { precompile: null, modules },
        'ember-cli-htmlbars:inline-precompile',
      ];
    });

    it('is false when no plugins exist', function() {
      let plugins = [];

      assert.strictEqual(utils.isInlinePrecompileBabelPluginRegistered(plugins), false);
    });

    it('detects when the non-parallelizable version of the plugin has been installed', function() {
      let plugins = [nonParallelizablePlugin];

      assert.strictEqual(utils.isInlinePrecompileBabelPluginRegistered(plugins), true);
    });

    it('detects when the parallelizable version of the plugin has been installed', function() {
      let plugins = [parallelizablePlugin];

      assert.strictEqual(utils.isInlinePrecompileBabelPluginRegistered(plugins), true);
    });
  });

  describe('isColocatedBabelPluginRegistered', function() {
    it('is false when no plugins exist', function() {
      let plugins = [];

      assert.strictEqual(utils.isColocatedBabelPluginRegistered(plugins), false);
    });

    it('detects when the plugin exists', function() {
      let plugins = [require.resolve('../lib/colocated-babel-plugin')];

      assert.strictEqual(utils.isColocatedBabelPluginRegistered(plugins), true);
    });
  });
});
