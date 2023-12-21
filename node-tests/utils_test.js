'use strict';

const utils = require('../lib/utils');
const assert = require('assert');
const { expect } = require('./assertions');

describe('utils', function () {
  describe('setupPlugins', function () {
    it('for 0 plugins', function () {
      let pluginWrappers = [];

      let actual = utils.setupPlugins(pluginWrappers);

      expect(actual).toDeepEqualCode({
        plugins: [],
        pluginNames: [],
        cacheKeys: [],
        parallelConfigs: [],
        canParallelize: true,
        unparallelizableWrappers: [],
        dependencyInvalidation: false,
      });
    });

    it('canParallelize for 1+ plugins with "parallelBabel" property', function () {
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
            return this.parallelBabel;
          },
          parallelBabel: 'something else',
        },
      ];

      let actual = utils.setupPlugins(pluginWrappers);

      expect(actual).toDeepEqualCode({
        plugins: pluginWrappers.map((w) => w.plugin),
        pluginNames: ['first', 'second'],
        cacheKeys: ['something', 'something else'],
        parallelConfigs: ['something', 'something else'],
        canParallelize: true,
        unparallelizableWrappers: [],
        dependencyInvalidation: false,
      });
    });

    it('canParallelize is false for 1+ plugins without "parallelBabel" property', function () {
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

      expect(actual).toDeepEqualCode({
        plugins: pluginWrappers.map((w) => w.plugin),
        pluginNames: ['first', 'second'],
        cacheKeys: ['something', 'something else'],
        parallelConfigs: ['something'],
        canParallelize: false,
        unparallelizableWrappers: ['second'],
        dependencyInvalidation: false,
      });
    });
  });

  describe('isInlinePrecompileBabelPluginRegistered', function () {
    let nonParallelizablePlugin, parallelizablePlugin;

    beforeEach(function () {
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
        {},
        require.resolve('ember-source/dist/ember-template-compiler'),
      );

      [
        require.resolve('babel-plugin-htmlbars-inline-precompile'),
        { precompile: null, modules },
        'ember-cli-htmlbars:inline-precompile',
      ];
    });

    it('is false when no plugins exist', function () {
      let plugins = [];

      assert.strictEqual(
        utils.isInlinePrecompileBabelPluginRegistered(plugins),
        false,
      );
    });

    it('detects when the non-parallelizable version of the plugin has been installed', function () {
      let plugins = [nonParallelizablePlugin];

      assert.strictEqual(
        utils.isInlinePrecompileBabelPluginRegistered(plugins),
        true,
      );
    });

    it('detects when the parallelizable version of the plugin has been installed', function () {
      let plugins = [parallelizablePlugin];

      assert.strictEqual(
        utils.isInlinePrecompileBabelPluginRegistered(plugins),
        true,
      );
    });
  });

  describe('isInlinePrecompileBabelPluginRegistered', function () {
    it('is false when no plugins exist', function () {
      let plugins = [];

      assert.strictEqual(
        utils.isInlinePrecompileBabelPluginRegistered(plugins),
        false,
      );
    });

    it('detects when the htmlbars-inline-precompile plugin exists', function () {
      let plugins = [
        utils.setup(
          {},
          { requiresModuleApiPolyfill: true, templateCompilerPath: '.' },
        ),
      ];

      assert.strictEqual(
        utils.isInlinePrecompileBabelPluginRegistered(plugins),
        true,
      );
    });

    it('detects when the ember-template-compilation plugin exists', function () {
      let plugins = [
        utils.setup(
          { plugins: [] },
          { requiresModuleApiPolyfill: false, templateCompilerPath: '.' },
        ),
      ];

      assert.strictEqual(
        utils.isInlinePrecompileBabelPluginRegistered(plugins),
        true,
      );
    });

    it('detects when the parallelized plugin exists', function () {
      let plugins = [
        utils.buildParalleizedBabelPlugin({}, {}, '', false, true),
      ];

      assert.strictEqual(
        utils.isInlinePrecompileBabelPluginRegistered(plugins),
        true,
      );
    });
  });

  describe('isColocatedBabelPluginRegistered', function () {
    it('is false when no plugins exist', function () {
      let plugins = [];

      assert.strictEqual(
        utils.isColocatedBabelPluginRegistered(plugins),
        false,
      );
    });

    it('detects when the plugin exists', function () {
      let plugins = [require.resolve('../lib/colocated-babel-plugin')];

      assert.strictEqual(utils.isColocatedBabelPluginRegistered(plugins), true);
    });
  });
});
