'use strict';

var htmlbarsCompile = require('./index');

module.exports = {
  name: 'ember-cli-htmlbars',
  included: function (app) {
    var self = this;

    this._super.included.apply(this, arguments);

    this.registerTransforms(app.registry);

    // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
    app.registry.remove('template', 'broccoli-ember-hbs-template-compiler');

    app.registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      toTree: function(tree) {

        return htmlbarsCompile(tree, { htmlbarsOptions: self.htmlbarsOptions() });
      }
    })
  },

  htmlbarsOptions: function() {
    var projectConfig = this.app.project.config(this.app.env);
    var htmlbarsEnabled = projectConfig.EmberENV.FEATURES['ember-htmlbars'];
    var htmlbarsComponentGeneration = projectConfig.EmberENV.FEATURES['ember-htmlbars-component-generation'];

    var htmlbarsOptions;
    if (htmlbarsEnabled) {
      htmlbarsOptions = {
        disableComponentGeneration: htmlbarsComponentGeneration !== true,

        plugins: {
          ast: this.astPlugins()
        }
      };
    }

    return htmlbarsOptions;
  },

  registerTransforms: function(registry) {
    var eachTransform = require('./ext/plugins/transform-each-in-to-hash');
    var withTransform = require('./ext/plugins/transform-with-as-to-hash');

    registry.add('htmlbars-ast-plugin', {
      name: 'transform-each-in-to-hash',
      plugin: eachTransform
    });

    registry.add('htmlbars-ast-plugin', {
      name: 'transform-with-as-to-hash',
      plugin: withTransform
    });
  },

  astPlugins: function() {
    var plugins = this.app.registry.load('htmlbars-ast-plugin');
    var pluginFunctions = plugins.map(function(plugin) {
      return plugin.plugin;
    });

    return pluginFunctions;
  }
}
