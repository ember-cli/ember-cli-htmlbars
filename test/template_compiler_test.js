'use strict';

var fs = require('fs');
var broccoli = require('broccoli');
var assert = require('assert');
var templateCompilerFilter = require('../index');
var htmlbarsCompiler = require('htmlbars').compileSpec;
var handlbarsTemplateCompiler = require('ember-template-compiler');

var builder;

describe('templateCompilerFilter', function(){
  var sourcePath = 'test/fixtures';

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  describe('HTMLBars', function() {
    var htmlbarsOptions;

    beforeEach(function() {
      htmlbarsOptions = {
        disableComponentGeneration: true
      };
    });

    it('precompiles templates into htmlbars', function(){
      var tree = templateCompilerFilter(sourcePath, { htmlbarsOptions: htmlbarsOptions });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var actual = fs.readFileSync(results.directory + '/template.js', { encoding: 'utf8'});
        var source = fs.readFileSync(sourcePath + '/template.hbs', { encoding: 'utf8' });
        var expected = "export default Ember.HTMLBars.template(" + htmlbarsCompiler(source) + ");";

        assert.equal(actual,expected,'They dont match!')
      });
    });

    it('passes provided options to htmlbars', function(){
      var tree = templateCompilerFilter(sourcePath, { htmlbarsOptions: htmlbarsOptions });

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var actual = fs.readFileSync(results.directory + '/web-component-template.js', { encoding: 'utf8'});
        var source = fs.readFileSync(sourcePath + '/web-component-template.hbs', { encoding: 'utf8' });
        var expected = "export default Ember.HTMLBars.template(" + htmlbarsCompiler(source, htmlbarsOptions) + ");";

        assert.equal(actual,expected,'They dont match!')
      });
    });
  });

  describe('handlebars', function() {
    it('compiles .handlebars file', function() {
      var tree = templateCompilerFilter(sourcePath);

      builder = new broccoli.Builder(tree);
      return builder.build().then(function(results) {
        var actual = fs.readFileSync(results.directory + '/non-standard-extension.js', { encoding: 'utf8'});
        var source = fs.readFileSync(sourcePath + '/non-standard-extension.handlebars', { encoding: 'utf8' });
        var expected = 'export default Ember.Handlebars.template(' + handlbarsTemplateCompiler.precompile(source, false) + ')';

        assert.equal(actual,expected,'They dont match!')
      });
    });

    function assertOutput(results) {
      var actual = fs.readFileSync(results.directory + '/template.js', { encoding: 'utf8'});
      var source = fs.readFileSync(sourcePath + '/template.hbs', { encoding: 'utf8' });
      var expected = 'export default Ember.Handlebars.template(' + handlbarsTemplateCompiler.precompile(source, false) + ')';

      assert.equal(actual,expected,'They dont match!')
    }

    it('precompiles templates into handlebars by default', function(){
      var tree = templateCompilerFilter(sourcePath);

      builder = new broccoli.Builder(tree);
      return builder.build().then(assertOutput);
    });

    it('precompiles templates into handlebars when HTMLBars option is false', function(){
      var tree = templateCompilerFilter(sourcePath, { htmlbarsOptions: false });

      builder = new broccoli.Builder(tree);
      return builder.build().then(assertOutput);
    });
  });
});
