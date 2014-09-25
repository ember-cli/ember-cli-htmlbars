var Filter = require('broccoli-filter');
var path = require('path');
var pickFiles = require('broccoli-static-compiler')
var es6 = require('broccoli-es6-module-transpiler');
var broccoli = require('broccoli');
var fs = require('fs');
var concat = require('broccoli-concat');
var merge = require('broccoli-merge-trees');

var ES6Handlebars = pickFiles('node_modules/handlebars/lib', {
  srcDir: '/handlebars/',
  destDir: '/handlebars/'
});

var htmlbarsFiles = pickFiles('node_modules/htmlbars/packages/htmlbars-compiler/lib', {
  srcDir: '/',
  files: ['**/*.js'],
  destDir: '/htmlbars-compiler'
})

build = merge([ES6Handlebars, htmlbarsFiles])

build = es6(build, {
  formatter: 'commonjs',
  output   : 'htmlbars-compiler.js'
});


builder = new broccoli.Builder(build);
builder.build().then(function(dir) {
  var compiler = fs.readFileSync(dir.directory + '/htmlbars-compiler.js', { encoding: 'utf8'});
  TemplateCompiler.prototype._compiler = new Function(compiler)
});

function TemplateCompiler (inputTree, options) {
  if (!(this instanceof TemplateCompiler)) {
      return new TemplateCompiler(inputTree, options);
  }
  this.inputTree = inputTree;
}

TemplateCompiler.prototype.compile = function(string){
  while(typeof(this._compiler) === 'undefined') {}
  return this._compiler(string)
}

TemplateCompiler.prototype = Object.create(Filter.prototype);
TemplateCompiler.prototype.constructor = TemplateCompiler;
TemplateCompiler.prototype.extensions = ['htmlbars'];
TemplateCompiler.prototype.targetExtension = 'js';

TemplateCompiler.prototype.processString = function (string) {
  return 'export default' + this.compiler(string);
}

module.exports = build
