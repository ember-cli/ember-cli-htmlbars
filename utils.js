'use strict';

module.exports = {
  template: function(templateCompiler, string, options) {
    var precompiled = templateCompiler.precompile(string, options);
    return 'Ember.HTMLBars.template(' + precompiled + ')';
  }
};
