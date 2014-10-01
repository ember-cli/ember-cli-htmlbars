var Filter = require('broccoli-filter');
var path = require('path');
var fs = require('fs');
var compilerSpec = require('./ext/htmlbars-compiler/compiler').compileSpec;

function TemplateCompiler (inputTree, options) {
  if (!(this instanceof TemplateCompiler)) {
    return new TemplateCompiler(inputTree, options);
  }

  this.inputTree = inputTree;
}

TemplateCompiler.prototype = Object.create(Filter.prototype);
TemplateCompiler.prototype.constructor = TemplateCompiler;
TemplateCompiler.prototype.extensions = ['hbs'];
TemplateCompiler.prototype.targetExtension = 'js';

TemplateCompiler.prototype.processString = function (string) {
  return compilerSpec(string)
}

module.exports = TemplateCompiler;
