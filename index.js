var Filter = require('broccoli-filter');
var compile = require('./compile');

function TemplateCompiler (inputTree, options) {
  if (!(this instanceof TemplateCompiler)) {
    return new TemplateCompiler(inputTree, options);
  }

  Filter.call(this, inputTree, options); // this._super()

  this.options = options || {};
  this.htmlbarsOptions= this.options.htmlbarsOptions;

  this.inputTree = inputTree;
}

TemplateCompiler.prototype = Object.create(Filter.prototype);
TemplateCompiler.prototype.constructor = TemplateCompiler;
TemplateCompiler.prototype.extensions = ['hbs', 'handlebars'];
TemplateCompiler.prototype.targetExtension = 'js';
TemplateCompiler.prototype.processString = function (string, relativePath) {
  return compile(string, this.htmlbarsOptions);
}

module.exports = TemplateCompiler;
