var Filter = require('broccoli-filter');
var path = require('path');
var fs = require('fs');
var compileSpec = require('./ext/htmlbars-compiler/compiler').compileSpec;
var handlbarsTemplateCompiler = require('ember-template-compiler');

function TemplateCompiler (inputTree, options) {
  if (!(this instanceof TemplateCompiler)) {
    return new TemplateCompiler(inputTree, options);
  }

  Filter.call(this, inputTree, options); // this._super()

  this.HTMLBars = options && options.HTMLBars || this.HTMLBars;
  this.inputTree = inputTree;
}

TemplateCompiler.prototype = Object.create(Filter.prototype);
TemplateCompiler.prototype.constructor = TemplateCompiler;
TemplateCompiler.prototype.extensions = ['hbs'];
TemplateCompiler.prototype.targetExtension = 'js';
TemplateCompiler.prototype.processString = function (string, relativePath) {
  if (this.HTMLBars) {
    return "export default " + compileSpec(string);
  } else {
    var input = handlbarsTemplateCompiler.precompile(string, false);
    return "export default Ember.Handlebars.template(" + input + ")";
  }
}

module.exports = TemplateCompiler;
