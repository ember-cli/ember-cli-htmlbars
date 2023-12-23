'use strict';

const path = require('path');
const SilentError = require('silent-error');
const utils = require('./utils');

let registryInvocationCounter = 0;

module.exports = {
  name: require('../package').name,

  parentRegistry: null,

  setupPreprocessorRegistry(type, registry) {
    // when this.parent === this.project, `this.parent.name` is a function 😭
    let parentName =
      typeof this.parent.name === 'function'
        ? this.parent.name()
        : this.parent.name;

    registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      toTree: (tree) => {
        const ColocatedTemplateProcessor = require('./colocated-broccoli-plugin');
        const TemplateCompiler = require('./template-compiler-plugin');

        let debugTree = require('broccoli-debug').buildDebugCallback(
          `ember-cli-htmlbars:${parentName}:tree-${registryInvocationCounter++}`,
        );

        let inputTree = debugTree(tree, '01-input');
        let colocatedTree = debugTree(
          new ColocatedTemplateProcessor(inputTree),
          '02-colocated-output',
        );
        let output = debugTree(
          new TemplateCompiler(colocatedTree),
          '03-output',
        );
        return output;
      },
    });

    if (type === 'parent') {
      this.parentRegistry = registry;
    }
  },

  included() {
    this._super.included.apply(this, arguments);

    let addonOptions = this._getAddonOptions();
    addonOptions.babel = addonOptions.babel || {};
    addonOptions.babel.plugins = addonOptions.babel.plugins || [];
    let babelPlugins = addonOptions.babel.plugins;

    if (!utils.isTemplateCompilationPluginRegistered(babelPlugins)) {
      babelPlugins.push([
        require.resolve('babel-plugin-ember-template-compilation'),
        {
          // For historic reasons, our plugins are stored in reverse order, whereas
          // babel-plugin-ember-template-compilation uses the sensible order.
          transforms: this.astPlugins(),
          compilerPath: require.resolve(this.templateCompilerPath()),
          enableLegacyModules: [
            'ember-cli-htmlbars',
            'ember-cli-htmlbars-inline-precompile',
            'htmlbars-inline-precompile',
          ],
        },
        'ember-cli-htmlbars:inline-precompile',
      ]);
    }

    if (!utils.isColocatedBabelPluginRegistered(babelPlugins)) {
      babelPlugins.push(require.resolve('./colocated-babel-plugin'));
    }
  },

  _getAddonOptions() {
    return (
      (this.parent && this.parent.options) ||
      (this.app && this.app.options) ||
      {}
    );
  },

  templateCompilerPath() {
    let app = this._findHost();
    let templateCompilerPath =
      app &&
      app.options &&
      app.options['ember-cli-htmlbars'] &&
      app.options['ember-cli-htmlbars'].templateCompilerPath;

    if (templateCompilerPath) {
      return path.resolve(this.project.root, templateCompilerPath);
    }

    let ember = this.project.findAddonByName('ember-source');
    if (!ember) {
      throw new SilentError(
        `ember-cli-htmlbars: Cannot find the ember-source addon as part of the project, please ensure that 'ember-source' is in your projects dependencies or devDependencies`,
      );
    }

    return ember.absolutePaths.templateCompiler;
  },

  astPlugins() {
    let pluginWrappers = this.parentRegistry.load('htmlbars-ast-plugin');
    return utils.convertPlugins(pluginWrappers);
  },
};
