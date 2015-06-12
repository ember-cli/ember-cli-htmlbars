'use strict';
var utils = require('../utils');
var assert = require('assert');

describe('utils', function(){
  var templateCompiler;

  beforeEach(function() {
    templateCompiler = require('../bower_components/ember/ember-template-compiler');
  });


  it('passes other ENV variables to compiler when provided', function(){
    var EmberENV = {
      FOO_BAR: true
    };

    utils.initializeEmberENV(templateCompiler, EmberENV);

    assert.equal(templateCompiler._Ember.ENV.FOO_BAR, true);
  });

  it('passes features through when provided', function(){
    var EmberENV = {
      FEATURES: {
        BLAH: true
      }
    };

    utils.initializeEmberENV(templateCompiler, EmberENV);

    assert.equal(templateCompiler._Ember.FEATURES.BLAH, true);
  });
});
