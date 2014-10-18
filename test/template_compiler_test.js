'use strict';

var fs = require('fs');
var broccoli = require('broccoli');
var assert = require('assert');
var templateCompilerFilter = require('../index');
var htmlbarsCompiler = require('../ext/htmlbars-compiler/compiler').compileSpec;

var builder;

describe('templateCompilerFilter', function(){
  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  it('precompiles templates into htmlbars', function(){
    var sourcePath = 'test/fixtures';
    var tree = templateCompilerFilter(sourcePath, { HTMLBars: true });

    builder = new broccoli.Builder(tree);
    return builder.build().then(function(results) {
      var actual = fs.readFileSync(results.directory + '/template.js', { encoding: 'utf8'});
      var source = fs.readFileSync(sourcePath + '/template.hbs', { encoding: 'utf8' });
      var expected = "export default " + htmlbarsCompiler(source);

      assert.equal(actual,expected,'They dont match!')
    });
  });
});
