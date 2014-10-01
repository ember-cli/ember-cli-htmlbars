'use strict';

var fs = require('fs');
var broccoli = require('broccoli');
var assert = require('assert');
var htmlbarsCompile = require('../index');

var builder;

describe('htmlbarsCompile', function(){
  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  it('precompiles templates into htmlbars', function(){
    var sourcePath = 'test/fixtures';

    var tree = htmlbarsCompile(sourcePath, {});

    builder = new broccoli.Builder(tree);
    return builder.build().then(function(dir) {
      var actual = fs.readFileSync(dir.directory + '/template.js', { encoding: 'utf8'});
      var expected = fs.readFileSync('test/fixtures/precompiled.js', {encoding: 'utf8'})
      assert.equal(actual,expected,'They dont match!')
    });
  });
});
