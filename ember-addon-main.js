'use strict';

var path = require('path');
var checker = require('ember-cli-version-checker');
var utils = require('./utils');
var hashForDep = require('hash-for-dep');

module.exports = {
  name: 'ember-cli-htmlbars',

  init: function() {
    if (this._super.init) { this._super.init.apply(this, arguments); }
    checker.assertAbove(this, '0.1.2');
  },

  parentRegistry: null,

  shouldSetupRegistryInIncluded: function() {
    return !checker.isAbove(this, '0.2.0');
  },

  purgeModule: function(templateCompilerPath) {
    // ensure we get a fresh templateCompilerModuleInstance per ember-addon
    // instance NOTE: this is a quick hack, and will only work as long as
    // templateCompilerPath is a single file bundle
    //
    // (╯°□°）╯︵ ɹǝqɯǝ
    //
    // we will also fix this in ember for future releases

    // Module will be cached in .parent.children as well. So deleting from require.cache alone is not sufficient.
    var mod = require.cache[templateCompilerPath];
    if (mod && mod.parent) {
      var index = mod.parent.children.indexOf(mod);
      if (index >= 0) {
        mod.parent.children.splice(index, 1);
      } else {
        throw new TypeError("ember-cli-htmlbars attempted to purge '" + templateCompilerPath + "' but something went wrong.");
      }
    }

    delete require.cache[templateCompilerPath];
  },

  setupPreprocessorRegistry: function(type, registry) {
    // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
    registry.remove('template', 'broccoli-ember-hbs-template-compiler');

    registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      _addon: this,
      toTree: function(tree) {
        var htmlbarsOptions = this._addon.htmlbarsOptions();
        return require('./index')(tree, htmlbarsOptions);
      },

      precompile: function(string) {
        var htmlbarsOptions = this._addon.htmlbarsOptions();
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

    var ember = this.project.findAddonByName('ember-source');
    if (ember) {
      return ember.absolutePaths.templateCompiler;
    } else if (!templateCompilerPath) {
      templateCompilerPath = this.project.bowerDirectory + '/ember/ember-template-compiler';
    }

    var absolutePath = path.resolve(this.project.root, templateCompilerPath);

    if (path.extname(absolutePath) === '') {
      absolutePath += '.js';
    }

    return absolutePath;
  },

  htmlbarsOptions: function() {
    var projectConfig = this.projectConfig() || {};
    var EmberENV = projectConfig.EmberENV || {};
    var templateCompilerPath = this.templateCompilerPath();

    this.purgeModule(templateCompilerPath);

    var clonedEmberENV = JSON.parse(JSON.stringify(EmberENV));
    global.EmberENV = clonedEmberENV; // Needed for eval time feature flag checks
    var pluginInfo = this.astPlugins();

    var htmlbarsOptions = {
      isHTMLBars: true,
      EmberENV: EmberENV,
      templateCompiler: require(templateCompilerPath),
      templateCompilerPath: templateCompilerPath,

      plugins: {
        ast: pluginInfo.plugins
      },

      pluginCacheKey: pluginInfo.cacheKeys
    };

    this.purgeModule(templateCompilerPath);

    delete global.Ember;
    delete global.EmberENV;

    return htmlbarsOptions;
  },

  astPlugins: function() {
    var pluginWrappers = this.parentRegistry.load('htmlbars-ast-plugin');
    var plugins = [];
    var cacheKeys = [];

    for (var i = 0; i < pluginWrappers.length; i++) {
      var wrapper = pluginWrappers[i];

      plugins.push(wrapper.plugin);

      var providesBaseDir = typeof wrapper.baseDir === 'function';
      var augmentsCacheKey = typeof wrapper.cacheKey === 'function';

      if (providesBaseDir || augmentsCacheKey) {
        if (providesBaseDir) {
          var pluginHashForDep = hashForDep(wrapper.baseDir());
          cacheKeys.push(pluginHashForDep);
        }
        if (augmentsCacheKey) {
          cacheKeys.push(wrapper.cacheKey());
        }
      } else {
        // support for ember-cli < 2.2.0
        var log = this.ui.writeDeprecateLine || this.ui.writeLine;

        log.call(this.ui, 'ember-cli-htmlbars is opting out of caching due to an AST plugin that does not provide a caching strategy: `' + wrapper.name + '`.');
        cacheKeys.push((new Date()).getTime() + '|' + Math.random());
      }
    }

    return {
      plugins: plugins,
      cacheKeys: cacheKeys
    };
  }
};
