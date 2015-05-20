'use strict';

var utils = require('./utils');
var Filter = require('broccoli-filter');

function TemplateCompiler (inputTree, options) {
  if (!(this instanceof TemplateCompiler)) {
    return new TemplateCompiler(inputTree, options);
  }

  Filter.call(this, inputTree, options); // this._super()

  this.options = options || {};
  this.inputTree = inputTree;

  this.precompile = this.options.templateCompiler.precompile;
  this.registerPlugin = this.options.templateCompiler.registerPlugin;

  this.registerPlugins();
  this.initializeFeatures();
}

TemplateCompiler.prototype = Object.create(Filter.prototype);
TemplateCompiler.prototype.constructor = TemplateCompiler;
TemplateCompiler.prototype.extensions = ['hbs', 'handlebars'];
TemplateCompiler.prototype.targetExtension = 'js';

TemplateCompiler.prototype.registerPlugins = function registerPlugins() {
  var plugins = this.options.plugins;

  if (plugins) {
    for (var type in plugins) {
      for (var i = 0, l = plugins[type].length; i < l; i++) {
        this.registerPlugin(type, plugins[type][i]);
      }
    }
  }
};

TemplateCompiler.prototype.initializeFeatures = function initializeFeatures() {
  var FEATURES = this.options.FEATURES;
  var templateCompiler = this.options.templateCompiler;

  utils.initializeFeatures(templateCompiler, FEATURES);
};

TemplateCompiler.prototype.processString = function (string, relativePath) {
  return 'export default ' + utils.template(this.options.templateCompiler, string, {
    moduleName: relativePath
  }) + ';';
};

module.exports = TemplateCompiler;
