'use strict';

var path = require('path');
var checker = require('ember-cli-version-checker');
var htmlbarsCompile = require('./index');
var utils = require('./utils');

module.exports = {
  name: 'ember-cli-htmlbars',

  init: function() {
    checker.assertAbove(this, '0.1.2');
  },

  parentRegistry: null,

  shouldSetupRegistryInIncluded: function() {
    return !checker.isAbove(this, '0.2.0');
  },

  setupPreprocessorRegistry: function(type, registry) {
    var self = this;

    // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
    registry.remove('template', 'broccoli-ember-hbs-template-compiler');

    registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      toTree: function(tree) {
        var htmlbarsOptions = self.htmlbarsOptions();
        return htmlbarsCompile(tree, htmlbarsOptions);
      },

      precompile: function(string) {
        var htmlbarsOptions = self.htmlbarsOptions();
        var templateCompiler = htmlbarsOptions.templateCompiler;
        return utils.template(templateCompiler, string);
      }
    });

    if (type === 'parent') {
      this.parentRegistry = registry;
    }
  },

  included: function (app) {
    this._super.included.apply(this, arguments);

    if (this.shouldSetupRegistryInIncluded()) {
      this.setupPreprocessorRegistry('parent', app.registry);
    }
  },

  projectConfig: function () {
    return this.project.config(process.env.EMBER_ENV);
  },

  templateCompilerPath: function() {
    var config = this.projectConfig();
    var templateCompilerPath = config['ember-cli-htmlbars'] && config['ember-cli-htmlbars'].templateCompilerPath;

    if (!templateCompilerPath) {
      templateCompilerPath = this.project.bowerDirectory + '/ember/ember-template-compiler';
    }

    return path.resolve(this.project.root, templateCompilerPath);
  },

  htmlbarsOptions: function() {
    var projectConfig = this.projectConfig() || {};
    var EmberENV = projectConfig.EmberENV || {};
    var templateCompilerPath = this.templateCompilerPath() + '.js';

    var htmlbarsOptions = {
      isHTMLBars: true,
      EmberENV: EmberENV,
      templateCompiler: require(templateCompilerPath),

      plugins: {
        ast: this.astPlugins()
      }
    };
    // ensure we get a fresh templateCompilerModuleInstance per ember-addon
    // instance NOTE: this is a quick hack, and will only work as long as
    // templateCompilerPath is a single file bundle
    //
    // (╯°□°）╯︵ ɹǝqɯǝ
    //
    // we will also fix this in ember for future releases
    delete require.cache[templateCompilerPath];
    delete global.Ember;

    return htmlbarsOptions;
  },

  astPlugins: function() {
    var pluginWrappers = this.parentRegistry.load('htmlbars-ast-plugin');
    var plugins = pluginWrappers.map(function(wrapper) {
      return wrapper.plugin;
    });

    return plugins;
  }
};
