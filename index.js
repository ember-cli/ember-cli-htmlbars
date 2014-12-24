var Filter = require('broccoli-filter');
var handlbarsTemplateCompiler = require('ember-template-compiler');

function TemplateCompiler (inputTree, options) {
  if (!(this instanceof TemplateCompiler)) {
    return new TemplateCompiler(inputTree, options);
  }

  Filter.call(this, inputTree, options); // this._super()

  this.options = options || {};

  this.inputTree = inputTree;

  if (this.options.isHTMLBars) {
    this.precompile = this.options.templateCompiler.precompile;
    this.templateWrapper = "export default Ember.HTMLBars.template(";
  } else {
    this.precompile = handlbarsTemplateCompiler.precompile;
    this.templateWrapper = "export default Ember.Handlebars.template(";
  }

  this.registerPlugins();
  this.initializeFeatures();
}

TemplateCompiler.prototype = Object.create(Filter.prototype);
TemplateCompiler.prototype.constructor = TemplateCompiler;
TemplateCompiler.prototype.extensions = ['hbs', 'handlebars'];
TemplateCompiler.prototype.targetExtension = 'js';

TemplateCompiler.prototype.registerPlugins = function registerPlugins() {
  var plugins = this.options.plugins;
  var templateCompiler = this.options.templateCompiler;

  if (plugins && templateCompiler) {
    for (var type in plugins) {
      for (var i = 0, l = plugins[type].length; i < l; i++) {

        templateCompiler.registerPlugin(type, plugins[type][i]);
      }
    }
  }
};

TemplateCompiler.prototype.initializeFeatures = function initializeFeatures() {
  var FEATURES = this.options.FEATURES;
  var templateCompiler = this.options.templateCompiler;

  if (FEATURES && templateCompiler) {
    for (var feature in FEATURES) {
      templateCompiler._Ember.FEATURES[feature] = FEATURES[feature];
    }
  }
};

TemplateCompiler.prototype.processString = function (string, relativePath) {
  return this.templateWrapper + this.precompile(string, false) + ');';
}

module.exports = TemplateCompiler;
