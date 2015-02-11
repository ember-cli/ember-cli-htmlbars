'use strict';

var path = require('path');
var htmlbarsCompile = require('./index');

module.exports = {
  name: 'ember-cli-htmlbars',

  shouldSetupRegistryInIncluded: function() {
    var version = this.project.emberCLIVersion();

    var portions = version.split('.');
    portions = portions.map(function(portion) {
      return Number(portion.split('-')[0]);
    });

    if (portions[0] > 0) {
      return false;
    } else if (portions[1] > 1) {
      return false;
    } else {
      return true;
    }
  },

  setupPreprocessorRegistry: function(type, registry) {
    // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
    registry.remove('template', 'broccoli-ember-hbs-template-compiler');

    registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      toTree: function(tree) {

        return htmlbarsCompile(tree, self.htmlbarsOptions());
      }
    })
  },

  included: function (app) {
    var self = this;

    this._super.included.apply(this, arguments);

    if (this.shouldSetupRegistryInIncluded()) {
      this.setupPreprocessorRegistry('parent', app.registry);
    }
  },

  emberPath: function() {
    var asset = this.app.vendorFiles['ember.js'];
    var assetPath;

    if (typeof asset === 'object') {
      assetPath = asset[this.env] || asset.development;
    } else {
      assetPath = asset;
    }

    assetPath = assetPath.replace(path.sep, '/');

    return path.join(this.project.root, path.dirname(assetPath));
  },

  htmlbarsOptions: function() {
    var projectConfig = this.project.config(process.env.EMBER_ENV);

    var htmlbarsOptions = {
      isHTMLBars: true,
      FEATURES: projectConfig.EmberENV.FEATURES,
      templateCompiler: require(path.join(this.emberPath(), 'ember-template-compiler')),

      plugins: {
        ast: this.astPlugins()
      }
    };

    return htmlbarsOptions;
  },

  astPlugins: function() {
    var pluginWrappers = this.app.registry.load('htmlbars-ast-plugin');
    var plugins = pluginWrappers.map(function(wrapper) {
      return wrapper.plugin;
    });

    return plugins;
  }
}
