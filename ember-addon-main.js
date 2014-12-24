'use strict';

var path = require('path');
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

        return htmlbarsCompile(tree, self.htmlbarsOptions());
      }
    })
  },

  emberPath: function() {
    return path.join(this.project.root, this.app.bowerDirectory, 'ember');
  },

  htmlbarsOptions: function() {
    var emberVersion = require(this.emberPath() + '/bower.json').version;
    var projectConfig = this.app.project.config(this.app.env);
    var htmlbarsEnabled = !/^1\.[0-9]\./.test(emberVersion);

    var htmlbarsOptions;
    if (htmlbarsEnabled) {
      htmlbarsOptions = {
        isHTMLBars: true,
        FEATURES: projectConfig.EmberENV.FEATURES,
        templateCompiler: require(path.join(this.emberPath(), 'ember-template-compiler')),

        plugins: {
          ast: this.astPlugins()
        }
      };
    }

    return htmlbarsOptions;
  },

  registerTransforms: function(registry) {
    //var TransformEachInToHash = require('./ext/plugins/transform-each-in-to-hash');

    //// we have to wrap these in an object so the ember-cli
    //// registry doesn't try to call `new` on them (new is actually
    //// called within htmlbars when compiling a given template).
    //registry.add('htmlbars-ast-plugin', {
    //  name: 'transform-each-in-to-hash',
    //  plugin: TransformEachInToHash
    //});
  },

  astPlugins: function() {
    var pluginWrappers = this.app.registry.load('htmlbars-ast-plugin');
    var plugins = pluginWrappers.map(function(wrapper) {
      return wrapper.plugin;
    });

    return plugins;
  }
}
